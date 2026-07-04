import {
  IdentifierExpressionNode,
  NodeKind,
  type BinaryExpressionNode,
} from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import type { VariableSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/VariableSymbol";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { SymbolKind } from "@kina-lang/semantic-analyzer/src/types/symbol";

export class BinaryExpressionParser extends ExpressionParser<BinaryExpressionNode> {
  override parse(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    switch (node.operator) {
      case "=":
        return this.parseAssignment(node, currentScope, llvm, wantedType);
      default:
        throw new KinaAssertionError(
          "Operator is not supported yet: " + node.operator,
        );
    }
  }

  private parseAssignment(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const left = node.left;
    const right = node.right;

    if (left.kind !== NodeKind.IdentifierExpression)
      throw new KinaAssertionError(
        "Left side of assignment must be an identifier expression",
      );

    const parentFunction = llvm.activeFunction;
    if (!parentFunction)
      throw new KinaAssertionError(
        "No active function found for variable declaration statement",
      );

    const identifierNode = left as IdentifierExpressionNode;

    const symbol = currentScope.lookup(identifierNode.name);
    if (!symbol)
      throw new KinaAssertionError(
        `Symbol ${identifierNode.name} not found in scope`,
      );

    if (symbol.kind !== SymbolKind.Variable)
      throw new KinaAssertionError(
        `Symbol ${identifierNode.name} is not a variable`,
      );

    const llvmType = LLVMTypeTranslator.kinaToLLVM(
      llvm,
      (symbol as VariableSymbol).type,
    );
    const value = KinaIRBuilder.parseExpression(
      right,
      currentScope,
      llvm,
      llvmType,
    );

    const alloca = llvm.lookupSymbol(symbol);
    if (!alloca)
      throw new KinaAssertionError(
        `LLVM value not found for symbol: ${symbol.name}`,
      );

    llvm.builder.CreateStore(value, alloca);

    return value;
  }
}
