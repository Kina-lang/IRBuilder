import type { LiteralExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { TokenKind } from "@kina-lang/lexer";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";

export class LiteralExpressionParser extends ExpressionParser<LiteralExpressionNode> {
  override parse(
    node: LiteralExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    switch (node.literalType) {
      case TokenKind.LiteralInteger:
        return this.parseIntegerLiteral(node, currentScope, llvm, wantedType);
      case TokenKind.LiteralBoolean:
        return this.parseBooleanLiteral(node, currentScope, llvm, wantedType);
      default:
        throw new KinaAssertionError(
          `Unsupported literal type: ${node.literalType}`,
        );
    }
  }

  private parseIntegerLiteral(
    node: LiteralExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    if (!wantedType) return llvm.builder.getInt32(Number(node.value));

    for (const width of LLVMTypeTranslator.llvmTypeIntegerWidths) {
      if (wantedType.isIntegerTy(width))
        return llvm.builder.getIntN(width, Number(node.value));
    }

    throw new KinaAssertionError(
      `Wanted type is not an integer type: ${wantedType}`,
    );
  }

  private parseBooleanLiteral(
    node: LiteralExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    if (!wantedType) return llvm.builder.getInt1(node.value === "true");

    if (wantedType.isIntegerTy(1))
      return llvm.builder.getInt1(node.value === "true");

    throw new KinaAssertionError(
      `Wanted type is not a boolean type: ${wantedType}`,
    );
  }
}
