import type { CallExpressionNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import type { LLVMBaseExpression } from "../../llvm/expressions/_base";
import { LLVMCall } from "../../llvm/expressions/LLVMCall";
import { processExpression } from "../_index";
import { KinaAssertionError } from "@kina-lang/utils";

export class CallExpressionBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: CallExpressionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): LLVMBaseExpression {
    const parentBB = builder.currentBasicBlock;
    if (!parentBB)
      throw new KinaAssertionError(
        "Call expression must be compiled in a basic block",
      );

    const callee = processExpression(node.callee, rootScope, builder);
    const parameters = node.arguments.map((param) => {
      const expr = processExpression(param, rootScope, builder);
      return parentBB.flatten(expr);
    });

    return new LLVMCall(builder, callee, parameters);
  }
}
