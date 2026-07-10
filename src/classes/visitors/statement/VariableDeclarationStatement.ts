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
import { TokenKind } from "@kina-lang/lexer";
import { KinaRuntimeArcMem } from "../../runtime/KinaRuntimeArcMem";

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

    llvm.clearTemporaryReleaseQueue();

    const llvmType = LLVMTypeTranslator.kinaToLLVM(
      llvm,
      node.type,
      currentScope,
    );
    const value = KinaIRBuilder.parseExpression(
      node.value,
      currentScope,
      llvm,
      llvmType,
    );

    const alloca = llvm.builder.CreateAlloca(llvmType);
    llvm.builder.CreateStore(value, alloca);
    llvm.defineSymbol(symbol, alloca);

    const varType = (symbol as any).type;
    if (varType === TokenKind.TypeString) {
      const charPtr = llvm.builder.CreateExtractValue(value, [0]);
      KinaRuntimeArcMem.retain(llvm, charPtr);
    }

    llvm.flushTemporaryReleaseQueue();

    return true;
  }
}
