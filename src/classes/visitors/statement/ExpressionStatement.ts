import { NodeKind, type ExpressionStatementNode } from "@kina-lang/ast";
import { BaseVisitor } from "../_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaIRBuilder } from "../../KinaIRBuilder";

export class ExpressionStatementVisitor extends BaseVisitor<ExpressionStatementNode> {
  override visit(
    node: ExpressionStatementNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind !== NodeKind.ExpressionStatement) return false;

    // Parse the expression and ignore the result, since it's a statement
    const val = KinaIRBuilder.parseExpression(
      node.expression,
      currentScope,
      llvm,
      null,
    );

    return true;
  }
}
