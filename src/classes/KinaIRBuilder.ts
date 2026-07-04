import {
  GroupExpressionNode,
  IdentifierExpressionNode,
  LiteralExpressionNode,
  NodeKind,
  type BaseNode,
  type FileNode,
} from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import { LLVM } from "./LLVM";
import type { BaseVisitor } from "./visitors/_base";
import { FileVisitor } from "./visitors/FileVisitor";
import { KinaAssertionError, KinaLogger } from "@kina-lang/utils";
import { ExternVisitor } from "./visitors/ExternVisitor";
import { FunctionVisitor } from "./visitors/FunctionVisitor";
import { BasicBlockVisitor } from "./visitors/BasicBlockVisitor";
import { ReturnStatementVisitor } from "./visitors/statement/ReturnStatement";
import type { ExpressionBaseNode } from "@kina-lang/ast/src/classes/nodes/_expression";
import { LiteralExpressionParser } from "./parsers/expression/LiteralExpressionParser";
import type llvm from "@designliquido/llvm-bindings";
import { GroupExpressionParser } from "./parsers/expression/GroupExpressionParser";
import { VariableDeclarationStatementVisitor } from "./visitors/statement/VariableDeclarationStatement";
import { IdentifierExpressionParser } from "./parsers/expression/IdentifierExpressionParser";

export class KinaIRBuilder {
  // Node visitors, sorted by priority (higher priority visitors are executed first)
  private static readonly _VISITORS: BaseVisitor[] = [
    new FileVisitor(),
    new ExternVisitor(),
    new FunctionVisitor(),
    new BasicBlockVisitor(),
    new ReturnStatementVisitor(),
    new VariableDeclarationStatementVisitor(),
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

  public static parseExpression(
    node: ExpressionBaseNode,
    scope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    switch (node.kind) {
      case NodeKind.LiteralExpression:
        return new LiteralExpressionParser().parse(
          node as LiteralExpressionNode,
          scope,
          llvm,
          wantedType,
        );
      case NodeKind.GroupExpression:
        return new GroupExpressionParser().parse(
          node as GroupExpressionNode,
          scope,
          llvm,
          wantedType,
        );
      case NodeKind.IdentifierExpression:
        return new IdentifierExpressionParser().parse(
          node as IdentifierExpressionNode,
          scope,
          llvm,
          wantedType,
        );
      default:
        throw new KinaAssertionError(
          `No expression parser found for node kind: ${node.kind}`,
        );
    }
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
