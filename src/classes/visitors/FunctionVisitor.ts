import {
  BasicBlockNode,
  NodeKind,
  PrimitiveTypeNode,
  type FunctionNode,
} from "@kina-lang/ast";
import { BaseVisitor, type IFirstPassVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";
import { KinaIRBuilder } from "../KinaIRBuilder";
import type { BasicBlockSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/BasicBlockSymbol";
import type { FunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/FunctionSymbol";
import type { IVisitMeta } from "../../types/meta";
import { KinaRuntimeArcMem } from "../runtime/KinaRuntimeArcMem";
import { TokenKind } from "@kina-lang/lexer";

export class FunctionVisitor
  extends BaseVisitor<FunctionNode>
  implements IFirstPassVisitor<FunctionNode>
{
  override visit(node: FunctionNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.Function) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    // Find function from first pass
    const func = llvm.module.getFunction(symbol.mangledName);
    if (!func)
      throw new KinaAssertionError(
        `Function ${node.name} not found in LLVM module`,
      );

    llvm.setActiveFunction(func, symbol as FunctionSymbol);

    const bodyBbNode = node.body as BasicBlockNode;
    const bodyBbSymbol = (symbol as FunctionSymbol).scope.lookup(
      bodyBbNode.name,
    );
    if (!bodyBbSymbol)
      throw new KinaAssertionError(
        `Basic block ${bodyBbNode.name} not found in function ${node.name}`,
      );

    const bodyBbScope = (bodyBbSymbol as BasicBlockSymbol).scope;

    const basicBlock = llvm.ll.BasicBlock.Create(
      llvm.context,
      symbol.mangledName,
      func,
    );
    llvm.builder.SetInsertPoint(basicBlock);

    // Process body basic block nodes
    for (const child of node.body.nodes) {
      KinaIRBuilder.processNode(child, bodyBbScope, llvm);
    }

    KinaRuntimeArcMem.releaseScopeVariables(llvm, bodyBbScope);

    // Automatically terminate with return, when possible
    if (!basicBlock.getTerminator()) {
      if (
        !(node.returnType instanceof PrimitiveTypeNode) ||
        node.returnType.primitiveKind !== TokenKind.TypeVoid
      )
        throw new KinaAssertionError(
          `Function ${node.name} has a non-void return type but no terminator`,
        );

      llvm.builder.CreateRetVoid();
    }

    llvm.setActiveFunction(null, null);

    return true;
  }

  public firstPass(
    node: FunctionNode,
    currentScope: Scope,
    llvm: LLVM,
    meta?: Partial<IVisitMeta>,
  ): boolean {
    if (node.kind !== NodeKind.Function) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const returnType = LLVMTypeTranslator.kinaToLLVM(
      llvm,
      node.returnType,
      currentScope,
    );
    const paramTypes = node.parameters.map((param) =>
      LLVMTypeTranslator.kinaToLLVM(llvm, param.type, currentScope),
    );
    const functionType = llvm.ll.FunctionType.get(
      returnType,
      paramTypes,
      false,
    );

    const func = llvm.ll.Function.Create(
      functionType,
      meta && meta.isExported
        ? llvm.ll.Function.LinkageTypes.ExternalLinkage
        : llvm.ll.Function.LinkageTypes.InternalLinkage,
      symbol.mangledName,
      llvm.module,
    );

    return true;
  }
}
