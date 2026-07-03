import type { LLVMName } from "../../../types/llvm/names";
import { LLVMBaseExpression } from "../expressions/_base";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMSSARegister extends LLVMBaseInstruction {
  private readonly _name: LLVMName;
  private readonly _expressionValue: LLVMBaseExpression;

  constructor(
    builder: LLVMBuilder,
    name: LLVMName,
    expressionValue: LLVMBaseExpression,
  ) {
    super(builder);

    this._name = name;
    this._expressionValue = expressionValue;

    this.addPrefixInstruction(this._expressionValue.prefix());
  }

  protected override getPostPrefix(): string {
    return `${this._name} = ${this._expressionValue.usage()}`;
  }
}
