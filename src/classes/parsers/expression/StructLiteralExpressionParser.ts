import { StructLiteralExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaRuntimeArcMem } from "../../runtime/KinaRuntimeArcMem";
import type { StructSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/StructSymbol";
import { KinaIRBuilder } from "../../KinaIRBuilder";

export class StructLiteralExpressionParser extends ExpressionParser<StructLiteralExpressionNode> {
  override parse(
    node: StructLiteralExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    if (wantedType === null || !wantedType.isStructTy())
      throw new KinaAssertionError(
        "Struct literal requires a struct type context",
      );

    const structType = wantedType as llvm.StructType;
    const mangledName = structType.getName();

    // Look up the StructSymbol to find the fields and their order
    const structSymbol = LLVMTypeTranslator.findStructSymbolByMangledName(
      currentScope,
      mangledName,
    );
    if (!structSymbol)
      throw new KinaAssertionError(
        `Struct symbol not found for mangled name: ${mangledName}`,
      );

    // Allocate memory on the heap
    const structSize = llvm.module.getDataLayout().getTypeAllocSize(structType);
    const heapAlloca = KinaRuntimeArcMem.alloc(
      llvm,
      llvm.builder.getInt64(structSize),
    );

    // Initialize all fields in the order they are defined in the struct
    (structSymbol as StructSymbol).fields.forEach((field, i) => {
      // Find the corresponding field value in the literal node
      const literalField = node.fields.find((f) => f.name === field.name);
      if (!literalField)
        throw new KinaAssertionError(
          `Field ${field.name} missing in struct literal`,
        );

      const fieldType = LLVMTypeTranslator.kinaToLLVM(
        llvm,
        field.type,
        currentScope,
      );
      const fieldValue = KinaIRBuilder.parseExpression(
        literalField.value,
        currentScope,
        llvm,
        fieldType,
      );

      // Store the value into the struct field using GEP
      const zero = llvm.builder.getInt32(0);
      const index = llvm.builder.getInt32(i);
      const fieldPtr = llvm.builder.CreateGEP(structType, heapAlloca, [
        zero,
        index,
      ]);
      llvm.builder.CreateStore(fieldValue, fieldPtr);
    });

    return heapAlloca;
  }
}
