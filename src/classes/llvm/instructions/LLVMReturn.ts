import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";

export class LLVMReturn extends LLVMBaseInstruction {
  constructor(builder: LLVMBuilder) {
    super(builder);
  }

  protected override getPostPrefix(): string {
    return `ret i32 0\n`;
  }
}
