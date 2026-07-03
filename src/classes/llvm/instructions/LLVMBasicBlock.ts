import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";
import { LLVMReturn } from "./LLVMReturn";

export class LLVMBasicBlock extends LLVMBaseInstruction {
  private readonly _name: string;

  constructor(builder: LLVMBuilder, name: string) {
    super(builder);

    this._name = name;
  }

  protected override getPostPrefix(): string {
    return `${this._name}:\n`;
  }

  public createReturn() {
    const i = new LLVMReturn(this._builder);
    this.addInstruction(i);

    return i;
  }

  protected override shouldIndentChildren(): boolean {
    return true;
  }
}
