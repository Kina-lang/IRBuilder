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
import { TokenKind } from "@kina-lang/lexer";
import { KinaRuntimeArcMem } from "../../runtime/KinaRuntimeArcMem";
import type { KinaType } from "../../../types/kina/types";

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
      case "+":
        return this.parseAddition(node, currentScope, llvm, wantedType);
      case "-":
        return this.parseSubtraction(node, currentScope, llvm, wantedType);
      case "*":
        return this.parseMultiplication(node, currentScope, llvm, wantedType);
      case "/":
        return this.parseDivision(node, currentScope, llvm, wantedType);
      case "%":
        return this.parseModulo(node, currentScope, llvm, wantedType);
      case "==":
        return this.parseEquality(node, currentScope, llvm, wantedType);
      case "!=":
        return this.parseInequality(node, currentScope, llvm, wantedType);
      case "<":
        return this.parseLessThan(node, currentScope, llvm, wantedType);
      case "<=":
        return this.parseLessThanOrEqual(node, currentScope, llvm, wantedType);
      case ">":
        return this.parseGreaterThan(node, currentScope, llvm, wantedType);
      case ">=":
        return this.parseGreaterThanOrEqual(
          node,
          currentScope,
          llvm,
          wantedType,
        );
      case "&&":
        return this.parseLogicalAnd(node, currentScope, llvm, wantedType);
      case "||":
        return this.parseLogicalOr(node, currentScope, llvm, wantedType);
      default:
        throw new KinaAssertionError(
          "Operator is not supported yet: " + node.operator,
        );
    }
  }

  private parseAddition(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateAdd(leftValue, rightValue);
  }

  private parseSubtraction(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateSub(leftValue, rightValue);
  }

  private parseMultiplication(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateMul(leftValue, rightValue);
  }

  private parseDivision(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateSDiv(leftValue, rightValue);
  }

  private parseEquality(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      null,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      leftValue.getType(),
    );

    return llvm.builder.CreateICmpEQ(leftValue, rightValue);
  }

  private parseInequality(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      null,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      leftValue.getType(),
    );

    return llvm.builder.CreateICmpNE(leftValue, rightValue);
  }

  private parseLessThan(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      null,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      leftValue.getType(),
    );

    return llvm.builder.CreateICmpSLT(leftValue, rightValue);
  }

  private parseLessThanOrEqual(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      null,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      leftValue.getType(),
    );

    return llvm.builder.CreateICmpSLE(leftValue, rightValue);
  }

  private parseGreaterThan(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      null,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      leftValue.getType(),
    );

    return llvm.builder.CreateICmpSGT(leftValue, rightValue);
  }

  private parseGreaterThanOrEqual(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      null,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      leftValue.getType(),
    );

    return llvm.builder.CreateICmpSGE(leftValue, rightValue);
  }

  private parseLogicalAnd(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateAnd(leftValue, rightValue);
  }

  private parseLogicalOr(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateOr(leftValue, rightValue);
  }

  private parseModulo(
    node: BinaryExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const leftValue = KinaIRBuilder.parseExpression(
      node.left,
      currentScope,
      llvm,
      wantedType,
    );
    const rightValue = KinaIRBuilder.parseExpression(
      node.right,
      currentScope,
      llvm,
      wantedType,
    );

    return llvm.builder.CreateSRem(leftValue, rightValue);
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

    const varType = (symbol as VariableSymbol).type;
    const llvmType = LLVMTypeTranslator.kinaToLLVM(llvm, varType as KinaType);
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

    // If the variable is a reference-counted type (e.g. String struct), we need to retain the new value and release the old value
    if (varType === TokenKind.TypeString) {
      const oldValue = llvm.builder.CreateLoad(llvmType, alloca);
      const oldCharPtr = llvm.builder.CreateExtractValue(oldValue, [0]);
      KinaRuntimeArcMem.release(llvm, oldCharPtr);

      const newCharPtr = llvm.builder.CreateExtractValue(value, [0]);
      KinaRuntimeArcMem.retain(llvm, newCharPtr);
    }

    llvm.builder.CreateStore(value, alloca);

    return value;
  }
}
