import type { LLVMGlobalName } from "../../../types/llvm/names";
import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMParameter } from "../helpers/LLVMParameter";
import { LLVMTypes } from "../helpers/LLVMTypes";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";
import { LLVMBasicBlock } from "./LLVMBasicBlock";
import { LLVMComment } from "./LLVMComment";

export class LLVMDefinition extends LLVMBaseInstruction {
  private readonly _name: LLVMGlobalName;
  private readonly _parameters: LLVMParameter[];
  private readonly _returnType: LLVMType;

  constructor(
    builder: LLVMBuilder,
    name: LLVMGlobalName,
    parameters: LLVMParameter[],
    returnType: LLVMType,
  ) {
    super(builder);

    this._name = name;
    this._parameters = parameters;
    this._returnType = returnType;
  }

  public createPrefixComment(comment: string) {
    const i = new LLVMComment(this._builder, comment);
    this.addPrefixInstruction(i);

    return i;
  }

  protected override getPostPrefix(): string {
    return `define ${this._returnType} ${this._name}(${this._parameters.map((p) => p.export()).join(", ")}) {\n`;
  }

  protected override getPostSuffix(): string {
    return `}\n`;
  }

  public createBasicBlock(name: string) {
    const i = new LLVMBasicBlock(this._builder, name);
    this.addInstruction(i);

    return i;
  }

  public get type(): LLVMType {
    return LLVMTypes.func(
      this._parameters.map((p) => p.type),
      this._returnType,
    );
  }

  public get value(): string {
    return this._name;
  }

  public get name(): LLVMGlobalName {
    return this._name;
  }
}
