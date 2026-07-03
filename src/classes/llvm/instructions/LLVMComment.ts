import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMComment extends LLVMBaseInstruction {
  private readonly _comment: string;

  constructor(builder: LLVMBuilder, comment: string) {
    super(builder);

    this._comment = comment;
  }

  protected override getPostSuffix(): string {
    return `\n; ${this._comment}\n`;
  }
}
