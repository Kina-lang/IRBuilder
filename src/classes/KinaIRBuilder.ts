import {
  BinaryExpressionNode,
  CallExpressionNode,
  GroupExpressionNode,
  IdentifierExpressionNode,
  LiteralExpressionNode,
  NodeKind,
  UnaryExpressionNode,
  MemberAccessExpressionNode,
  StructLiteralExpressionNode,
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
import { MemberAccessExpressionParser } from "./parsers/expression/MemberAccessExpressionParser";
import { IfStatementVisitor } from "./visitors/statement/IfStatement";
import { ImportVisitor } from "./visitors/ImportVisitor";
import { ExportVisitor } from "./visitors/ExportVisitor";
import type { IVisitMeta } from "../types/meta";
import { StructVisitor } from "./visitors/StructVisitor";
import { StructLiteralExpressionParser } from "./parsers/expression/StructLiteralExpressionParser";
import { KinaRuntimeArcMem } from "./runtime/KinaRuntimeArcMem";
import type { KinaCompiler } from "@kina-lang/compiler";

export class KinaIRBuilder {
  private static readonly _FP_VISITORS: IFirstPassVisitor[] = [
    new FileVisitor(),
    new ExternVisitor(),
    new ImportVisitor(),
    new ExportVisitor(),
    new FunctionVisitor(),
    new StructVisitor(),
  ];

  // Node visitors, sorted by priority (higher priority visitors are executed first)
  private static readonly _VISITORS: BaseVisitor[] = [
    new FileVisitor(),
    new ExternVisitor(),
    new ImportVisitor(),
    new ExportVisitor(),
    new FunctionVisitor(),
    new BasicBlockVisitor(),
    new ReturnStatementVisitor(),
    new VariableDeclarationStatementVisitor(),
    new ExpressionStatementVisitor(),
    new IfStatementVisitor(),
    new StructVisitor(),
  ];

  private static readonly _LOGGER: KinaLogger = new KinaLogger(
    KinaIRBuilder.name,
  );

  private readonly _compiler: KinaCompiler;

  constructor(compiler: KinaCompiler) {
    this._compiler = compiler;
  }

  public build(ast: FileNode, scope: Scope, isIncluded: boolean = false) {
    // TODO: Dynamically obtain the module ID
    const llvm = new LLVM("main", this._compiler);

    KinaRuntimeArcMem.init(llvm);

    const { initFn, entryBlock } = KinaIRBuilder.createInitFunction(llvm);

    KinaIRBuilder.firstPass(ast, scope, llvm);
    KinaIRBuilder.processNode(ast, scope, llvm);

    KinaIRBuilder.finalizeInitFunction(llvm, initFn, entryBlock);

    this.createAliases(llvm, scope, isIncluded);

    return llvm.emit();
  }

  public static createInitFunction(llvm: LLVM): {
    entryBlock: llvm.BasicBlock;
    initFn: llvm.Function;
  } {
    // Create the global initializer function
    const initFnType = llvm.ll.FunctionType.get(
      llvm.builder.getVoidTy(),
      [],
      false,
    );
    const initFn = llvm.ll.Function.Create(
      initFnType,
      llvm.ll.Function.LinkageTypes.InternalLinkage,
      "kina_program_init",
      llvm.module,
    );
    const entryBlock = llvm.ll.BasicBlock.Create(llvm.context, "entry", initFn);

    return { entryBlock, initFn };
  }

  public static finalizeInitFunction(
    llvm: LLVM,
    initFn: llvm.Function,
    entryBlock: llvm.BasicBlock,
  ) {
    // Finalize kina_program_init with ret void
    const currentBlock = llvm.builder.GetInsertBlock();
    llvm.builder.SetInsertPoint(entryBlock);
    llvm.builder.CreateRetVoid();

    // Reset the insertion point to the previous block (if any)
    if (currentBlock) llvm.builder.SetInsertPoint(currentBlock);
    else llvm.builder.ClearInsertionPoint();

    // Register to @llvm.global_ctors
    const structType = llvm.ll.StructType.get(llvm.context, [
      llvm.builder.getInt32Ty(),
      llvm.builder.getPtrTy(),
      llvm.builder.getPtrTy(),
    ]);

    const arrayType = llvm.ll.ArrayType.get(structType, 1);
    const ctorVal = llvm.ll.ConstantStruct.get(structType, [
      llvm.builder.getInt32(65535),
      initFn,
      llvm.ll.ConstantPointerNull.get(llvm.builder.getPtrTy()),
    ]);
    const ctorArray = llvm.ll.ConstantArray.get(arrayType, [ctorVal]);

    new llvm.ll.GlobalVariable(
      llvm.module,
      arrayType,
      false,
      llvm.ll.GlobalValue.LinkageTypes.AppendingLinkage,
      ctorArray,
      "llvm.global_ctors",
    );
  }

  public static firstPass(
    node: BaseNode,
    scope: Scope,
    llvm: LLVM,
    meta?: Partial<IVisitMeta>,
  ): void {
    // Ignored, this is used only by compiler
    if (node.kind == NodeKind.IncludeDirective) return;

    for (const visitor of this._FP_VISITORS) {
      if (visitor.firstPass(node, scope, llvm, meta)) return;
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
      case NodeKind.MemberAccessExpression:
        return new MemberAccessExpressionParser().parse(
          node as MemberAccessExpressionNode,
          scope,
          llvm,
          wantedType,
        );
      case NodeKind.StructLiteralExpression:
        return new StructLiteralExpressionParser().parse(
          node as StructLiteralExpressionNode,
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
