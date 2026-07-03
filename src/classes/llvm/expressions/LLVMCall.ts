import type { LLVMType } from "../../../types/llvm/types";
import { LLVMTypes } from "../helpers/LLVMTypes";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMCall extends LLVMBaseExpression {
  private readonly _callee: LLVMBaseExpression;
  private readonly _parameters: LLVMBaseExpression[];

  constructor(
    builder: LLVMBuilder,
    callee: LLVMBaseExpression,
    parameters: LLVMBaseExpression[],
  ) {
    super(builder);

    this._callee = callee;
    this._parameters = parameters;
  }

  public override prefix(): string {
    return "";
  }

  public override usage(): string {
    return `call ${this._callee.returnType} ${this._callee.usage()}(${this._parameters.map((p) => `${p.returnType} ${p.usage()}`).join(", ")})`;
  }

  public override get type(): LLVMType {
    return this._callee.returnType;
  }
}
