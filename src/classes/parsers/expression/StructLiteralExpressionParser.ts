import { StructLiteralExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { KinaAssertionError } from "@kina-lang/utils";

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

    // Allocate memory for the struct literal
    const structAlloca = llvm.builder.CreateAlloca(structType);

    // Initialize all fields in the order they are defined in the struct
    structSymbol.fields.forEach((fieldSymbol: any, i: number) => {
      // Find the corresponding field value in the literal node
      const literalField = node.fields.find((f) => f.name === fieldSymbol.name);
      if (!literalField)
        throw new KinaAssertionError(
          `Field ${fieldSymbol.name} missing in struct literal`,
        );

      const fieldType = LLVMTypeTranslator.kinaToLLVM(
        llvm,
        fieldSymbol.type,
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
      const fieldPtr = llvm.builder.CreateGEP(structType, structAlloca, [
        zero,
        index,
      ]);
      llvm.builder.CreateStore(fieldValue, fieldPtr);
    });

    // Load the struct value from the allocated address and return it
    const load = llvm.builder.CreateLoad(structType, structAlloca);
    return load;
  }
}
