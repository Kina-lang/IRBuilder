import type { BaseNode, FileNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import { LLVMContext } from "./llvm/LLVMContext";
import { LLVMBuilder } from "./llvm/LLVMBuilder";
import { LLVMModule } from "./llvm/instructions/LLVMModule";

export class KinaIRBuilder {
  constructor() {}

  public build(ast: FileNode, scope: Scope): string {
    const ctx = new LLVMContext();
    const builder = new LLVMBuilder(ctx);

    this.processFileNode(ast, scope, builder);

    return builder.export();
  }

  public processFileNode(
    node: FileNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const module = builder.module("main");

    for (const child of node.nodes) {
      this.processNode(child, rootScope, builder, module);
    }
  }

  public processNode(
    node: BaseNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    module: LLVMModule,
  ): void {}
}
