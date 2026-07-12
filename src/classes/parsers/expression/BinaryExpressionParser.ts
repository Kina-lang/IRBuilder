import {
  IdentifierExpressionNode,
  MemberAccessExpressionNode,
  NodeKind,
  type BinaryExpressionNode,
} from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import { KinaSemanticAnalyzer, type Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import type { VariableSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/VariableSymbol";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { SymbolKind } from "@kina-lang/semantic-analyzer/src/types/symbol";
import { TokenKind } from "@kina-lang/lexer";
import { KinaRuntimeArcMem } from "../../runtime/KinaRuntimeArcMem";
import type { KinaType } from "../../../types/kina/types";
import { AnalysisContext } from "@kina-lang/semantic-analyzer/src/classes/AnalysisContext";

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

    const parentFunction = llvm.activeFunction;
    if (!parentFunction)
      throw new KinaAssertionError(
        "No active function found for variable declaration statement",
      );

    let varType: KinaType;
    let llvmType: llvm.Type;
    let alloca: llvm.Value | undefined;

    if (left.kind === NodeKind.IdentifierExpression) {
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

      varType = (symbol as VariableSymbol).type as KinaType;
      llvmType = LLVMTypeTranslator.kinaToLLVM(
        llvm,
        varType as KinaType,
        currentScope,
      );

      alloca = llvm.lookupSymbol(symbol);
      if (!alloca)
        throw new KinaAssertionError(
          `LLVM value not found for symbol: ${symbol.name}`,
        );
    } else if (left.kind === NodeKind.MemberAccessExpression) {
      // Get pointer to the struct
      const objectValue = KinaIRBuilder.parseExpression(
        (left as MemberAccessExpressionNode).object,
        currentScope,
        llvm,
        null,
      );

      // Get type of the struct
      const objectKinaType = KinaSemanticAnalyzer.checkExpression(
        (left as MemberAccessExpressionNode).object,
        currentScope,
        new AnalysisContext(llvm.compiler, ""), // TODO: This is sh!t, fix
      );

      if (
        typeof objectKinaType !== "string" ||
        !objectKinaType.startsWith("udt.")
      )
        throw new KinaAssertionError(
          "Left side of assignment must be a user-defined type (struct) member access expression",
        );

      // Get llvm struct type
      const structType = LLVMTypeTranslator.getStructType(
        llvm,
        objectKinaType as KinaType,
        currentScope,
      );
      const mangledName = structType.getName();

      // Find llvm struct in the current scope
      const structSymbol = LLVMTypeTranslator.findStructSymbolByMangledName(
        currentScope,
        mangledName,
      );
      if (!structSymbol)
        throw new KinaAssertionError(
          `Struct symbol not found for mangled name: ${mangledName}`,
        );

      // Find the index of the field in the struct
      const fieldIndex = structSymbol.fields.findIndex(
        (f: any) => f.name === (left as MemberAccessExpressionNode).property,
      );
      if (fieldIndex === -1)
        throw new KinaAssertionError(
          `Field '${(left as MemberAccessExpressionNode).property}' not found in struct '${structSymbol.name}'`,
        );

      // Get the type of the field
      const fieldNode = structSymbol.fields[fieldIndex];
      varType = (fieldNode as any).type as KinaType;
      llvmType = LLVMTypeTranslator.kinaToLLVM(
        llvm,
        fieldNode!.type,
        currentScope,
      );

      // Get the pointer to the field using GEP
      const zero = llvm.builder.getInt32(0);
      const index = llvm.builder.getInt32(fieldIndex);
      alloca = llvm.builder.CreateGEP(structType, objectValue, [zero, index]);
    } else
      throw new KinaAssertionError(
        "Left side of assignment must be an identifier expression or member access expression",
      );

    const value = KinaIRBuilder.parseExpression(
      right,
      currentScope,
      llvm,
      llvmType,
    );

    // If the variable is a reference-counted type (e.g. String struct), we need to retain the new value and release the old value
    if (
      varType === TokenKind.TypeString ||
      (typeof varType === "string" && varType.startsWith("udt."))
    ) {
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
