import type { GroupExpressionNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import type { LLVMBaseExpression } from "../../llvm/expressions/_base";
import { processExpression } from "../_index";
import type { LLVMType } from "../../../types/llvm/types";

export class GroupExpressionBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: GroupExpressionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    wantedType: LLVMType | null = null,
  ): LLVMBaseExpression {
    return processExpression(node.expression, rootScope, builder, wantedType);
  }
}
