import {
  ExternNode,
  FunctionNode,
  NodeKind,
  type BaseNode,
  type FileNode,
} from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import { LLVMContext } from "./llvm/LLVMContext";
import { LLVMBuilder } from "./llvm/LLVMBuilder";
import { LLVMModule } from "./llvm/instructions/LLVMModule";
import { KinaAssertionError } from "@kina-lang/utils";
import { Builders } from "./builders/_index";

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
    const module = builder.createModule("main");

    for (const child of node.nodes) {
      this.processNode(child, rootScope, builder, module);
    }
  }

  public processNode(
    node: BaseNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    module: LLVMModule,
  ): void {
    switch (node.kind) {
      case NodeKind.IncludeDirective:
        // no op: directives are handled by compiler, not IR
        break;
      case NodeKind.Extern:
        Builders.Extern.process(node as ExternNode, rootScope, builder, module);
        break;
      case NodeKind.Function:
        Builders.Function.process(
          node as FunctionNode,
          rootScope,
          builder,
          module,
        );
        break;
      default:
        throw new KinaAssertionError(`Unknown node kind: ${node.kind}`);
    }
  }
}
