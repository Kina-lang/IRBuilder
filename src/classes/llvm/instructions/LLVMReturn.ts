import type { LLVMBaseExpression } from "../expressions/_base";
import { LLVMTypes } from "../helpers/LLVMTypes";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMReturn extends LLVMBaseInstruction {
  private readonly _valueExpression: LLVMBaseExpression;

  constructor(builder: LLVMBuilder, valueExpression: LLVMBaseExpression) {
    super(builder);

    this._valueExpression = valueExpression;
    this.addPrefixInstruction(valueExpression.prefix());
  }

  protected override getPostPrefix(): string {
    return `ret ${this._valueExpression.type} ${this._valueExpression.type != LLVMTypes.void ? this._valueExpression.usage() : ""}\n`;
  }
}
