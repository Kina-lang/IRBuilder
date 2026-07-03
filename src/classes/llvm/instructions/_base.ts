import type { LLVMBuilder } from "../LLVMBuilder";

export abstract class LLVMBaseInstruction {
  protected readonly _builder: LLVMBuilder;
  protected readonly _children: Set<LLVMBaseInstruction> = new Set([]);

  constructor(builder: LLVMBuilder) {
    this._builder = builder;
  }

  public get ctx() {
    return this._builder.ctx;
  }

  protected addInstruction(instruction: LLVMBaseInstruction) {
    this._children.add(instruction);
  }

  public export(): string {
    let output = "";

    for (const child of this._children) {
      output += child.export();
    }

    return output;
  }
}
