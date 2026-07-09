import {
  NodeKind,
  type VariableDeclarationStatementNode,
} from "@kina-lang/ast";
import { BaseVisitor } from "../_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import { KinaIRBuilder } from "../../KinaIRBuilder";

export class VariableDeclarationStatementVisitor extends BaseVisitor<VariableDeclarationStatementNode> {
  override visit(
    node: VariableDeclarationStatementNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind !== NodeKind.VariableDeclarationStatement) return false;

    const parentFunction = llvm.activeFunction;
    if (!parentFunction)
      throw new KinaAssertionError(
        "No active function found for variable declaration statement",
      );

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const llvmType = LLVMTypeTranslator.kinaToLLVM(llvm, node.type, currentScope);
    const value = KinaIRBuilder.parseExpression(
      node.value,
      currentScope,
      llvm,
      llvmType,
    );

    const alloca = llvm.builder.CreateAlloca(llvmType);
    llvm.builder.CreateStore(value, alloca);
    llvm.defineSymbol(symbol, alloca);

    return true;
  }
}
