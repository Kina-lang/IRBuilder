import type { LLVMGlobalName } from "../../../types/llvm/names";
import type { LLVMType } from "../../../types/llvm/types";
import { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";
import { LLVMComment } from "./LLVMComment";
import { LLVMDeclaration } from "./LLVMDeclaration";

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
}
