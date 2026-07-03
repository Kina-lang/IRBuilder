import { LiteralExpressionNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import { LLVMBaseExpression } from "../../llvm/expressions/_base";
import { KinaAssertionError } from "@kina-lang/utils";
import { TokenKind } from "@kina-lang/lexer";
import { LLVMNumberLiteral } from "../../llvm/expressions/LLVMNumberLiteral";
import type { LLVMType } from "../../../types/llvm/types";

export class LiteralExpressionBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: LiteralExpressionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    wantedType: LLVMType | null = null,
  ): LLVMBaseExpression {
    switch (node.literalType) {
      case TokenKind.LiteralInteger:
      case TokenKind.LiteralFloat:
        return new LLVMNumberLiteral(
          builder,
          builder.ctx.resolveLlvmLiteralType(node, wantedType),
          Number(node.value),
        );
      default:
        throw new KinaAssertionError(
          `Unsupported literal expression type: ${node.literalType}`,
        );
    }
  }
}
