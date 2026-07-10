import { MemberAccessExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import { KinaSemanticAnalyzer, type Scope } from "@kina-lang/semantic-analyzer";
import { AnalysisContext } from "@kina-lang/semantic-analyzer/src/classes/AnalysisContext";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import type { KinaType } from "../../../types/kina/types";

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

    const objectKinaType = KinaSemanticAnalyzer.checkExpression(
      node.object,
      currentScope,
      new AnalysisContext(llvm.compiler, ""), // TODO: This is sh!t, fix
    );

    if (
      typeof objectKinaType === "string" &&
      objectKinaType.startsWith("udt.")
    ) {
      const structType = LLVMTypeTranslator.getStructType(
        llvm,
        objectKinaType as KinaType,
        currentScope,
      );
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
        fieldNode!.type,
        currentScope,
      );

      const zero = llvm.builder.getInt32(0);
      const fieldPtr = llvm.builder.CreateGEP(structType, objectVal, [
        zero,
        llvm.builder.getInt32(fieldIndex),
      ]);

      return llvm.builder.CreateLoad(fieldType, fieldPtr);
    }

    throw new KinaAssertionError(
      `Unsupported member access property: ${node.property}`,
    );
  }
}
