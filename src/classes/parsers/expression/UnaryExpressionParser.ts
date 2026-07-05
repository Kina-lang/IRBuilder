import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { ExpressionParser } from "./_base";
import type { UnaryExpressionNode } from "@kina-lang/ast";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { KinaAssertionError } from "@kina-lang/utils";

export class UnaryExpressionParser extends ExpressionParser {
  override parse(
    node: UnaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    switch (node.operator) {
      case "+":
        // TODO: Cast into number type?
        // no-op: return the value of the right expression as is
        return KinaIRBuilder.parseExpression(
          node.right,
          currentScope,
          llvm,
          wantedType,
        );
      case "-":
        return this.parseNegation(node, currentScope, llvm, wantedType);
      case "!":
        return this.parseLogicalNot(node, currentScope, llvm, wantedType);
      default:
        throw new KinaAssertionError(
          `Unsupported unary operator: ${node.operator}`,
        );
    }
  }

  private parseNegation(
    node: UnaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    if (!wantedType) {
      // If no wanted type is provided, we assume the right value is an integer and negate it
      return llvm.builder.CreateNeg(rightValue);
    }

    return llvm.builder.CreateNeg(rightValue);
  }

  private parseLogicalNot(
    node: UnaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    if (!wantedType) {
      // If no wanted type is provided, we assume the right value is a boolean and negate it
      return llvm.builder.CreateNot(rightValue);
    }

    return llvm.builder.CreateNot(rightValue);
  }
}
