import type { LLVMGlobalName } from "../../../types/llvm/names";
import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMParameter } from "../helpers/LLVMParameter";
import { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";
import { LLVMComment } from "./LLVMComment";
import { LLVMDeclaration } from "./LLVMDeclaration";
import { LLVMDefinition } from "./LLVMDefinition";

export class LLVMModule extends LLVMBaseInstruction {
  private readonly _name: string;

  constructor(builder: LLVMBuilder, name: string) {
    super(builder);

    this._name = name;
    this.createComment(`ModuleID = "${this._name}"`);
  }

  public createComment(comment: string) {
    const i = new LLVMComment(this._builder, comment);
    this.addInstruction(i);

    return i;
  }

  public createDeclaration(
    name: LLVMGlobalName,
    parameterTypes: LLVMType[],
    returnType: LLVMType,
  ) {
    const i = new LLVMDeclaration(
      this._builder,
      name,
      parameterTypes,
      returnType,
    );
    this.addInstruction(i);

    return i;
  }

  public createDefinition(
    name: LLVMGlobalName,
    parameters: LLVMParameter[],
    returnType: LLVMType,
  ) {
    const i = new LLVMDefinition(this._builder, name, parameters, returnType);
    this.addInstruction(i);

    return i;
  }
}
