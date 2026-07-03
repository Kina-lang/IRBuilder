import type { LLVMGlobalName } from "../../../types/llvm/names";
import type { LLVMType } from "../../../types/llvm/types";
import { LLVMTypes } from "../helpers/LLVMTypes";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMDeclaration extends LLVMBaseInstruction {
  private readonly _name: LLVMGlobalName;
  private readonly _parameterTypes: LLVMType[];
  private readonly _returnType: LLVMType;

  constructor(
    builder: LLVMBuilder,
    name: LLVMGlobalName,
    parameterTypes: LLVMType[],
    returnType: LLVMType,
  ) {
    super(builder);

    this._name = name;
    this._parameterTypes = parameterTypes;
    this._returnType = returnType;
  }

  protected override getPostSuffix(): string {
    return `declare ${this._returnType} ${this._name}(${this._parameterTypes.join(", ")})\n`;
  }

  public get name(): LLVMGlobalName {
    return this._name;
  }

  public get type(): LLVMType {
    return LLVMTypes.func(this._parameterTypes, this._returnType);
  }

  public get returnType(): LLVMType {
    return this._returnType;
  }

  public usage(): string {
    return this._name;
  }
}
