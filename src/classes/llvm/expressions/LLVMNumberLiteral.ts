import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMNumberLiteral extends LLVMBaseExpression {
  private readonly _type: LLVMType;
  private readonly _value: number;

  constructor(builder: LLVMBuilder, type: LLVMType, value: number) {
    super(builder);

    this._type = type;
    this._value = value;
  }

  public override prefix(): string {
    return "";
  }

  public override usage(): string {
    return `${this._value}`;
  }

  public override get type(): LLVMType {
    return this._type;
  }
}
