import type { LLVMLocalName } from "../../../types/llvm/names";
import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMBuilder } from "../LLVMBuilder";

export class LLVMParameter {
  private readonly _builder: LLVMBuilder;
  private readonly _name: LLVMLocalName;
  private readonly _type: LLVMType;

  constructor(builder: LLVMBuilder, name: LLVMLocalName, type: LLVMType) {
    this._builder = builder;
    this._name = name;
    this._type = type;
  }

  public export(): string {
    return `${this._type} ${this._name}`;
  }

  public get type(): LLVMType {
    return this._type;
  }
}
