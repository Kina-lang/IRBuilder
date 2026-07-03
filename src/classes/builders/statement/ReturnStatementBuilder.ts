import type { ReturnStatementNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import { processExpression } from "../_index";
import type { LLVMBaseExpression } from "../../llvm/expressions/_base";
import { LLVMVoid } from "../../llvm/expressions/LLVMVoid";

export class ReturnStatementBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: ReturnStatementNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentBasicBlock;
    if (!parent)
      throw new Error("Return statement must be created in a basic block");

    let value: LLVMBaseExpression;
    if (node.value) value = processExpression(node.value, rootScope, builder);
    else value = new LLVMVoid(builder);

    parent.createReturn(value);
  }
}
