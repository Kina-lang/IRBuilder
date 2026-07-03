import type { ExpressionBaseNode } from "@kina-lang/ast/src/classes/nodes/_expression";
import { BasicBlockBuilder } from "./BasicBlockBuilder";
import { LiteralExpressionBuilder } from "./expression/LiteralExpressionBuilder";
import { ExternBuilder } from "./ExternBuilder";
import { FunctionBuilder } from "./FunctionBuilder";
import { ReturnStatementBuilder } from "./statement/ReturnStatementBuilder";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import type { LLVMBaseExpression } from "../llvm/expressions/_base";
import { LiteralExpressionNode, NodeKind } from "@kina-lang/ast";
import { KinaAssertionError } from "@kina-lang/utils";
import type { LLVMType } from "../../types/llvm/types";

export const Builders = {
  Extern: new ExternBuilder(),
  Function: new FunctionBuilder(),
  BasicBlock: new BasicBlockBuilder(),

  Statement: {
    Return: new ReturnStatementBuilder(),
  },

  Expression: {
    Literal: new LiteralExpressionBuilder(),
  },
};

export function processExpression(
  node: ExpressionBaseNode,
  scope: Scope,
  builder: LLVMBuilder,
  wantedType: LLVMType | null = null,
): LLVMBaseExpression {
  switch (node.kind) {
    case NodeKind.LiteralExpression:
      return Builders.Expression.Literal.process(
        node as LiteralExpressionNode,
        scope,
        builder,
        wantedType,
      );
    default:
      throw new KinaAssertionError(`Unsupported expression kind: ${node.kind}`);
  }
}
