import type { GroupExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaIRBuilder } from "../../KinaIRBuilder";

export class GroupExpressionParser extends ExpressionParser<GroupExpressionNode> {
  // Group expression is just container, hand off the inner expression to the IR builder
  override parse(
    node: GroupExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    return KinaIRBuilder.parseExpression(
      node.expression,
      currentScope,
      llvm,
      wantedType,
    );
  }
}
