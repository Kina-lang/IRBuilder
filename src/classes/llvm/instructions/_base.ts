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

  public export(indent: string = ""): string {
    let output = "";

    for (const child of this._prefixChildren) {
      output += child.export(indent);
    }

    const postPrefix = this.getPostPrefix();
    if (postPrefix) output += this.indentString(postPrefix, indent);

    const childIndent = this.shouldIndentChildren() ? indent + "  " : indent;
    for (const child of this._children) {
      output += child.export(childIndent);
    }

    for (const child of this._suffixChildren) {
      output += child.export(indent);
    }

    const postSuffix = this.getPostSuffix();
    if (postSuffix) output += this.indentString(postSuffix, indent);

    return output;
  }

  protected shouldIndentChildren(): boolean {
    return false;
  }

  protected indentString(str: string, indent: string): string {
    return str
      .split("\n")
      .map((line) => (line ? indent + line : line))
      .join("\n");
  }

  protected getPostPrefix(): string {
    return "";
  }

  protected getPostSuffix(): string {
    return "";
  }
}
