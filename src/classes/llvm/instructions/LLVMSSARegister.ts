import type { LLVMName } from "../../../types/llvm/names";
import type { LLVMType } from "../../../types/llvm/types";
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
    return `${this._name} = ${this._expressionValue.usage()}\n`;
  }

  public get name(): LLVMName {
    return this._name;
  }

  public get type(): LLVMType {
    return this._expressionValue.type;
  }

  public get returnType(): LLVMType {
    return this.type;
  }

  public usage(): string {
    return this._name;
  }
}
