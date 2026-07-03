import type { LLVMBuilder } from "../LLVMBuilder";

export abstract class LLVMBaseInstruction {
  protected readonly _builder: LLVMBuilder;
  protected readonly _prefixChildren: Set<LLVMBaseInstruction> = new Set([]);
  protected readonly _suffixChildren: Set<LLVMBaseInstruction> = new Set([]);
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

  protected addPrefixInstruction(instruction: LLVMBaseInstruction) {
    this._prefixChildren.add(instruction);
  }

  protected addSuffixInstruction(instruction: LLVMBaseInstruction) {
    this._suffixChildren.add(instruction);
  }

  public export(): string {
    let output = "";

    for (const child of this._prefixChildren) {
      output += child.export();
    }

    output += this.getPostPrefix();

    for (const child of this._children) {
      output += child.export();
    }

    for (const child of this._suffixChildren) {
      output += child.export();
    }

    output += this.getPostSuffix();

    return output;
  }

  protected getPostPrefix(): string {
    return "";
  }

  protected getPostSuffix(): string {
    return "";
  }
}
