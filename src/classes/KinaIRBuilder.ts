import { NodeKind, type BaseNode, type FileNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import { LLVM } from "./LLVM";
import type { BaseVisitor } from "./visitors/_base";
import { FileVisitor } from "./visitors/FileVisitor";
import { KinaAssertionError, KinaLogger } from "@kina-lang/utils";
import { ExternVisitor } from "./visitors/ExternVisitor";
import { FunctionVisitor } from "./visitors/FunctionVisitor";

export class KinaIRBuilder {
  // Node visitors, sorted by priority (higher priority visitors are executed first)
  private static readonly _VISITORS: BaseVisitor[] = [
    new FileVisitor(),
    new ExternVisitor(),
    new FunctionVisitor(),
  ];

  private static readonly _LOGGER: KinaLogger = new KinaLogger(
    KinaIRBuilder.name,
  );

  constructor() {}

  public build(ast: FileNode, scope: Scope) {
    // TODO: Dynamically obtain the module ID
    const llvm = new LLVM("main");

    KinaIRBuilder.processNode(ast, scope, llvm);

    this.createAliases(llvm, scope);

    return llvm.emit();
  }

  public static processNode(node: BaseNode, scope: Scope, llvm: LLVM): void {
    // Ignored, this is used only by compiler
    if (node.kind == NodeKind.IncludeDirective) return;

    for (const visitor of this._VISITORS) {
      if (visitor.visit(node, scope, llvm)) return;
    }

    // TODO: Switch to error
    KinaIRBuilder._LOGGER.fatal(`No visitor found for node kind: ${node.kind}`);
    /*throw new KinaAssertionError(
      "No visitor found for node kind: " + node.kind,
    );*/
  }

  private createAliases(llvm: LLVM, scope: Scope): void {
    const mainFn = scope.lookup("main");
    if (!mainFn) throw new KinaAssertionError("No main found!");

    llvm.createFunctionAlias(
      "kina_program_entry",
      "i32 ()",
      mainFn.mangledName,
    );
  }
}
