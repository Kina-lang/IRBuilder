import type { BaseNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";

export class ReturnStatementBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: BaseNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentBasicBlock;
    if (!parent)
      throw new Error("Return statement must be created in a basic block");

    parent.createReturn();
  }
}
