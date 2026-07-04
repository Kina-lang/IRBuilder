import { NodeKind, type FunctionNode } from "@kina-lang/ast";
import { BaseVisitor, type IFirstPassVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";
import { KinaIRBuilder } from "../KinaIRBuilder";
import type { FunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/FunctionSymbol";

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

    llvm.setActiveFunction(func);
    KinaIRBuilder.processNode(
      node.body,
      (symbol as FunctionSymbol).scope,
      llvm,
    );
    llvm.setActiveFunction(null);

    return true;
  }

  public firstPass(
    node: FunctionNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind !== NodeKind.Function) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const returnType = LLVMTypeTranslator.kinaToLLVM(llvm, node.returnType);
    const paramTypes = node.parameters.map((param) =>
      LLVMTypeTranslator.kinaToLLVM(llvm, param.type),
    );
    const functionType = llvm.ll.FunctionType.get(
      returnType,
      paramTypes,
      false,
    );

    const func = llvm.ll.Function.Create(
      functionType,
      llvm.ll.Function.LinkageTypes.ExternalLinkage,
      symbol.mangledName,
      llvm.module,
    );

    return true;
  }
}
