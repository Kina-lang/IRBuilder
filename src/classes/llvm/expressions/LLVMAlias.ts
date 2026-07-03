import { LLVMTypes } from "../helpers/LLVMTypes";
import type { LLVMDefinition } from "../instructions/LLVMDefinition";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMAlias extends LLVMBaseExpression {
  private readonly _fn: LLVMDefinition;

  constructor(builder: LLVMBuilder, fn: LLVMDefinition) {
    super(builder);

    this._fn = fn;
  }

  public override prefix(): string {
    return "";
  }

  public override usage(): string {
    return `alias ${this._fn.type}, ${LLVMTypes.pointer} ${this._fn.value}`;
  }
}
