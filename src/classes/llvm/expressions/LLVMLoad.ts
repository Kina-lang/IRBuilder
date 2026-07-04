import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMLoad extends LLVMBaseExpression {
  private readonly _type: LLVMType;
  private readonly _pointer: LLVMBaseExpression;
  private readonly _alignment: number;

  constructor(
    builder: LLVMBuilder,
    type: LLVMType,
    pointer: LLVMBaseExpression,
    alignment: number = 4,
  ) {
    super(builder);

    this._type = type;
    this._pointer = pointer;
    this._alignment = alignment;
  }

  public override prefix(): string {
    return this._pointer.prefix();
  }

  public override usage(): string {
    return `load ${this._type}, ${this._type}* ${this._pointer.usage()}, align ${this._alignment}`;
  }

  public override get type(): LLVMType {
    return this._type;
  }
}
