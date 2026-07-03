import type { ExpressionBaseNode } from "@kina-lang/ast/src/classes/nodes/_expression";
import { BasicBlockBuilder } from "./BasicBlockBuilder";
import { LiteralExpressionBuilder } from "./expression/LiteralExpressionBuilder";
import { ExternBuilder } from "./ExternBuilder";
import { FunctionBuilder } from "./FunctionBuilder";
import { ReturnStatementBuilder } from "./statement/ReturnStatementBuilder";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import type { LLVMBaseExpression } from "../llvm/expressions/_base";
import {
  CallExpressionNode,
  IdentifierExpressionNode,
  LiteralExpressionNode,
  NodeKind,
} from "@kina-lang/ast";
import { KinaAssertionError } from "@kina-lang/utils";
import type { LLVMType } from "../../types/llvm/types";
import { ExpressionStatementBuilder } from "./statement/ExpressionStatementBuilder";
import { CallExpressionBuilder } from "./expression/CallExpressionBuilder";
import { IdentifierExpressionBuilder } from "./expression/IdentifierExpressionBuilder";

export const Builders = {
  Extern: new ExternBuilder(),
  Function: new FunctionBuilder(),
  BasicBlock: new BasicBlockBuilder(),

  Statement: {
    Return: new ReturnStatementBuilder(),
    Expression: new ExpressionStatementBuilder(),
  },

  Expression: {
    Literal: new LiteralExpressionBuilder(),
    Call: new CallExpressionBuilder(),
    Identifier: new IdentifierExpressionBuilder(),
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
    case NodeKind.CallExpression:
      return Builders.Expression.Call.process(
        node as CallExpressionNode,
        scope,
        builder,
      );
    case NodeKind.IdentifierExpression:
      return Builders.Expression.Identifier.process(
        node as IdentifierExpressionNode,
        scope,
        builder,
      );
    default:
      throw new KinaAssertionError(`Unsupported expression kind: ${node.kind}`);
  }
}
