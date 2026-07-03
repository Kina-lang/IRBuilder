import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMComment extends LLVMBaseInstruction {
  private readonly _comment: string;

  constructor(builder: LLVMBuilder, comment: string) {
    super(builder);

    this._comment = comment;
  }

  override export(): string {
    return `; ${this._comment}\n`;
  }
}
