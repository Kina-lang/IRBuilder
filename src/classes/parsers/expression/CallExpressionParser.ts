import { NodeKind, type CallExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { KinaAssertionError } from "@kina-lang/utils";
import { TokenKind } from "@kina-lang/lexer";

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

    if (!(callee instanceof llvm.ll.Function))
      throw new KinaAssertionError(
        `Callee is not a function: ${node.callee.kind}`,
      );

    const call = llvm.builder.CreateCall(callee, args);

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
