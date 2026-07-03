import type { ExpressionStatementNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import { processExpression } from "../_index";
import { KinaAssertionError } from "@kina-lang/utils";
import { randomBytes } from "crypto";
import { LLVMTypes } from "../../llvm/helpers/LLVMTypes";
import { LLVMCall } from "../../llvm/expressions/LLVMCall";

export class ExpressionStatementBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: ExpressionStatementNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parentBB = builder.currentBasicBlock;
    if (!parentBB) throw new KinaAssertionError("No current basic block");

    const expression = processExpression(node.expression, rootScope, builder);

    if (expression instanceof LLVMCall) parentBB.flatten(expression);
    else if (expression.returnType !== LLVMTypes.void)
      parentBB.createSsaRegister(
        builder.ctx.llvmLocalName("Z" + randomBytes(8).toString("hex")),
        expression,
      );
  }
}
