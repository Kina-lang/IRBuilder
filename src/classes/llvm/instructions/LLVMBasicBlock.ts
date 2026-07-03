import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMBasicBlock extends LLVMBaseInstruction {
  private readonly _name: string;

  constructor(builder: LLVMBuilder, name: string) {
    super(builder);

    this._name = name;
  }

  protected override getPostPrefix(): string {
    return `${this._name}:\n`;
  }
}
