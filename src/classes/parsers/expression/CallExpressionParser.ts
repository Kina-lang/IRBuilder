import type { CallExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { KinaAssertionError } from "@kina-lang/utils";

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

    return call;
  }
}
