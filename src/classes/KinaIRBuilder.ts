import {
  BasicBlockNode,
  ExpressionStatementNode,
  ExternNode,
  FunctionNode,
  NodeKind,
  ReturnStatementNode,
  type BaseNode,
  type FileNode,
} from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import { LLVMContext } from "./llvm/LLVMContext";
import { LLVMBuilder } from "./llvm/LLVMBuilder";
import { KinaAssertionError } from "@kina-lang/utils";
import { Builders } from "./builders/_index";
import type { LLVMModule } from "./llvm/instructions/LLVMModule";

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
    const mod = builder.createModule("main");

    for (const child of node.nodes) {
      KinaIRBuilder.processNode(child, rootScope, builder);
    }

    this.createEntrypointAlias(builder, mod, rootScope);
  }

  public static processNode(
    node: BaseNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    switch (node.kind) {
      case NodeKind.IncludeDirective:
        // no op: directives are handled by compiler, not IR
        break;
      case NodeKind.Extern:
        Builders.Extern.process(node as ExternNode, rootScope, builder);
        break;
      case NodeKind.Function:
        Builders.Function.process(node as FunctionNode, rootScope, builder);
        break;
      case NodeKind.BasicBlock:
        Builders.BasicBlock.process(node as BasicBlockNode, rootScope, builder);
        break;
      case NodeKind.ReturnStatement:
        Builders.Statement.Return.process(
          node as ReturnStatementNode,
          rootScope,
          builder,
        );
        break;
      case NodeKind.ExpressionStatement:
        Builders.Statement.Expression.process(
          node as ExpressionStatementNode,
          rootScope,
          builder,
        );
        break;
      default:
        throw new KinaAssertionError(`Unknown node kind: ${node.kind}`);
    }
  }

  private createEntrypointAlias(
    builder: LLVMBuilder,
    module: LLVMModule,
    rootScope: Scope,
  ) {
    const mainFn = rootScope.lookup("main");
    if (!mainFn)
      throw new KinaAssertionError("Main function not found in scope");

    const mainDef = module.findDefinition(
      builder.ctx.llvmGlobalName(mainFn.mangledName),
    );
    if (!mainDef)
      throw new KinaAssertionError(
        "Main function definition not found in module",
      );

    module.createAlias(
      builder.ctx.llvmGlobalName("kina_program_entry"),
      mainDef,
    );
  }
}
