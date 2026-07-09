import { MemberAccessExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";

export class MemberAccessExpressionParser extends ExpressionParser<MemberAccessExpressionNode> {
  override parse(
    node: MemberAccessExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const objectVal = KinaIRBuilder.parseExpression(
      node.object,
      currentScope,
      llvm,
      null,
    );

    if (node.property === "___kina_internal") return objectVal;

    if (node.property === "length")
      return llvm.builder.CreateExtractValue(objectVal, [1]);

    if (node.property === "pointer")
      return llvm.builder.CreateExtractValue(objectVal, [0]);

    const objectType = objectVal.getType();
    if (objectType.isStructTy()) {
      const structType = objectType as llvm.StructType;
      const mangledName = structType.getName();

      const structSymbol = LLVMTypeTranslator.findStructSymbolByMangledName(
        currentScope,
        mangledName,
      );
      if (!structSymbol)
        throw new KinaAssertionError(
          `Struct symbol not found for mangled name: ${mangledName}`,
        );

      const fieldIndex = structSymbol.fields.findIndex(
        (f: any) => f.name === node.property,
      );
      if (fieldIndex === -1)
        throw new KinaAssertionError(
          `Field '${node.property}' not found in struct '${structSymbol.name}'`,
        );

      const fieldNode = structSymbol.fields[fieldIndex];
      const fieldType = LLVMTypeTranslator.kinaToLLVM(
        llvm,
        fieldNode.type,
        currentScope,
      );

      // Store the first-class struct value to a stack location so we can GEP it
      const tempAlloca = llvm.builder.CreateAlloca(structType);
      llvm.builder.CreateStore(objectVal, tempAlloca);

      const zero = llvm.builder.getInt32(0);
      const index = llvm.builder.getInt32(fieldIndex);
      const fieldPtr = llvm.builder.CreateGEP(structType, tempAlloca, [
        zero,
        index,
      ]);

      return llvm.builder.CreateLoad(fieldType, fieldPtr);
    }

    throw new KinaAssertionError(
      `Unsupported member access property: ${node.property}`,
    );
  }
}
