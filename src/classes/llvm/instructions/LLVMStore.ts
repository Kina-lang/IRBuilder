import type { LLVMBaseExpression } from "../expressions/_base";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMStore extends LLVMBaseInstruction {
  private readonly _value: LLVMBaseExpression;
  private readonly _pointer: LLVMBaseExpression;
  private readonly _alignment: number;

  constructor(
    builder: LLVMBuilder,
    value: LLVMBaseExpression,
    pointer: LLVMBaseExpression,
    alignment: number = 4,
  ) {
    super(builder);

    this._value = value;
    this._pointer = pointer;
    this._alignment = alignment;

    this.addPrefixInstruction(value.prefix());
    this.addPrefixInstruction(pointer.prefix());
  }

  protected override getPostPrefix(): string {
    return `store ${this._value.type} ${this._value.usage()}, ${this._value.type}* ${this._pointer.usage()}, align ${this._alignment}\n`;
  }
}
