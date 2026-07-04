import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMAlloca extends LLVMBaseExpression {
  private readonly _type: LLVMType;
  private readonly _alignment: number;

  constructor(builder: LLVMBuilder, type: LLVMType, alignment: number = 4) {
    super(builder);

    this._type = type;
    this._alignment = alignment;
  }

  public override prefix(): string {
    return ``;
  }

  public override usage(): string {
    return `alloca ${this._type}, align ${this._alignment}`;
  }

  public override get type(): LLVMType {
    return this._type;
  }
}
