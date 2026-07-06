import {
  BinaryExpressionNode,
  CallExpressionNode,
  GroupExpressionNode,
  IdentifierExpressionNode,
  LiteralExpressionNode,
  NodeKind,
  UnaryExpressionNode,
  type BaseNode,
  type FileNode,
} from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import { LLVM } from "./LLVM";
import type { BaseVisitor, IFirstPassVisitor } from "./visitors/_base";
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
import { ExpressionStatementVisitor } from "./visitors/statement/ExpressionStatement";
import { CallExpressionParser } from "./parsers/expression/CallExpressionParser";
import { BinaryExpressionParser } from "./parsers/expression/BinaryExpressionParser";
import { UnaryExpressionParser } from "./parsers/expression/UnaryExpressionParser";
import { IfStatementVisitor } from "./visitors/statement/IfStatement";
import { ImportVisitor } from "./visitors/ImportVisitor";

export class KinaIRBuilder {
  private static readonly _FP_VISITORS: IFirstPassVisitor[] = [
    new FileVisitor(),
    new ExternVisitor(),
    new ImportVisitor(),
    new FunctionVisitor(),
  ];

  // Node visitors, sorted by priority (higher priority visitors are executed first)
  private static readonly _VISITORS: BaseVisitor[] = [
    new FileVisitor(),
    new ExternVisitor(),
    new ImportVisitor(),
    new FunctionVisitor(),
    new BasicBlockVisitor(),
    new ReturnStatementVisitor(),
    new VariableDeclarationStatementVisitor(),
    new ExpressionStatementVisitor(),
    new IfStatementVisitor(),
  ];

  private static readonly _LOGGER: KinaLogger = new KinaLogger(
    KinaIRBuilder.name,
  );

  constructor() {}

  public build(ast: FileNode, scope: Scope, isIncluded: boolean = false) {
    // TODO: Dynamically obtain the module ID
    const llvm = new LLVM("main");

    KinaIRBuilder.firstPass(ast, scope, llvm);
    KinaIRBuilder.processNode(ast, scope, llvm);

    this.createAliases(llvm, scope, isIncluded);

    return llvm.emit();
  }

  public static firstPass(node: BaseNode, scope: Scope, llvm: LLVM): void {
    // Ignored, this is used only by compiler
    if (node.kind == NodeKind.IncludeDirective) return;

    for (const visitor of this._FP_VISITORS) {
      if (visitor.firstPass(node, scope, llvm)) return;
    }
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
      case NodeKind.CallExpression:
        return new CallExpressionParser().parse(
          node as CallExpressionNode,
          scope,
          llvm,
          wantedType,
        );
      case NodeKind.BinaryExpression:
        return new BinaryExpressionParser().parse(
          node as BinaryExpressionNode,
          scope,
          llvm,
          wantedType,
        );
      case NodeKind.UnaryExpression:
        return new UnaryExpressionParser().parse(
          node as UnaryExpressionNode,
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

  private createAliases(llvm: LLVM, scope: Scope, isIncluded: boolean): void {
    if (isIncluded) return;

    const mainFn = scope.lookup("main");
    if (!mainFn) throw new KinaAssertionError("No main found!");

    llvm.createFunctionAlias(
      "kina_program_entry",
      "i32 ()",
      mainFn.mangledName,
    );
  }
}
