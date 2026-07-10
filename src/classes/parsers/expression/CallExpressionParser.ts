import {
  FunctionTypeNode,
  IdentifierExpressionNode,
  MemberAccessExpressionNode,
  NodeKind,
  type CallExpressionNode,
} from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import { KinaSemanticAnalyzer, type Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { KinaAssertionError } from "@kina-lang/utils";
import { TokenKind } from "@kina-lang/lexer";
import type llvm from "@designliquido/llvm-bindings";
import { AnalysisContext } from "@kina-lang/semantic-analyzer/src/classes/AnalysisContext";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import type { KinaType } from "../../../types/kina/types";

export class CallExpressionParser extends ExpressionParser<CallExpressionNode> {
  override parse(
    node: CallExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const callee = KinaIRBuilder.parseExpression(
      node.callee,
      currentScope,
      llvm,
      wantedType,
    );
    const args = node.arguments.map((arg) =>
      KinaIRBuilder.parseExpression(arg, currentScope, llvm, null),
    );

    if (!(callee instanceof llvm.ll.Function || callee.getType().isPointerTy()))
      throw new KinaAssertionError(
        `Callee is not a function: ${node.callee.kind}`,
      );

    let call: llvm.Value;

    if (callee instanceof llvm.ll.Function)
      call = llvm.builder.CreateCall(callee, args);
    else {
      let returnType: llvm.Type = wantedType ?? llvm.builder.getVoidTy();

      if (node.callee.kind === NodeKind.MemberAccessExpression) {
        const memberAccess = node.callee as MemberAccessExpressionNode;
        const objectKinaType = KinaSemanticAnalyzer.checkExpression(
          memberAccess.object,
          currentScope,
          new AnalysisContext(llvm.compiler, ""),
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
          const structSymbol = LLVMTypeTranslator.findStructSymbolByMangledName(
            currentScope,
            structType.getName(),
          );

          if (structSymbol) {
            const field = structSymbol.fields.find(
              (f) => f.name === memberAccess.property,
            );

            if (field && field.type instanceof FunctionTypeNode) {
              returnType = LLVMTypeTranslator.kinaToLLVM(
                llvm,
                field.type.returnType,
                currentScope,
              );
            }
          }
        }
      } else if (node.callee.kind === NodeKind.IdentifierExpression) {
        const symbol = currentScope.lookup(
          (node.callee as IdentifierExpressionNode).name,
        );

        if (symbol && "returnType" in symbol) {
          const retType = (symbol as any).returnType;

          if (retType)
            returnType = LLVMTypeTranslator.kinaToLLVM(
              llvm,
              retType,
              currentScope,
            );
        }
      }

      const paramTypes = args.map((arg) => arg.getType());
      const funcType = llvm.ll.FunctionType.get(returnType, paramTypes, false);

      call = llvm.builder.CreateCall(funcType, callee, args);
    }

    // If the callee is a function that returns a reference-counted type, we need to queue the return value for release
    if (node.callee.kind === NodeKind.IdentifierExpression) {
      const calleeName = (node.callee as any).name;
      const symbol = currentScope.lookup(calleeName);

      if (symbol && "returnType" in symbol) {
        const retType = (symbol as any).returnType;

        if (retType === TokenKind.TypeString) {
          const charPtr = llvm.builder.CreateExtractValue(call, [0]);
          llvm.queueTemporaryForRelease(charPtr);
        } else if (typeof retType === "string" && retType.startsWith("udt.")) {
          llvm.queueTemporaryForRelease(call);
        }
      }
    }

    return call;
  }
}
