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
import type { VariableSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/VariableSymbol";

export class VariableDeclarationStatementVisitor extends BaseVisitor<VariableDeclarationStatementNode> {
  override visit(
    node: VariableDeclarationStatementNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind !== NodeKind.VariableDeclarationStatement) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const llvmType = LLVMTypeTranslator.kinaToLLVM(
      llvm,
      node.type,
      currentScope,
    );

    const parentFunction = llvm.activeFunction;
    if (!parentFunction) {
      return this.visitGlobal(
        node,
        currentScope,
        llvm,
        symbol as VariableSymbol,
        llvmType,
      );
    }

    // local variable declaration
    llvm.clearTemporaryReleaseQueue();

    let wantedType = llvmType;
    if (node.value.kind === NodeKind.StructLiteralExpression) {
      wantedType = LLVMTypeTranslator.getStructType(
        llvm,
        node.type,
        currentScope,
      );
    }

    const value = KinaIRBuilder.parseExpression(
      node.value,
      currentScope,
      llvm,
      wantedType,
    );

    const alloca = llvm.builder.CreateAlloca(llvmType);
    llvm.builder.CreateStore(value, alloca);
    llvm.defineSymbol(symbol, alloca);

    const varSymbol = symbol as VariableSymbol;
    const varType = varSymbol.type;

    if (varType === TokenKind.TypeString) {
      const charPtr = llvm.builder.CreateExtractValue(value, [0]);
      KinaRuntimeArcMem.retain(llvm, charPtr);
    } else if (typeof varType === "string" && varType.startsWith("udt.")) {
      if (node.value.kind !== NodeKind.StructLiteralExpression)
        KinaRuntimeArcMem.retain(llvm, value);
    }

    llvm.flushTemporaryReleaseQueue();

    return true;
  }

  private visitGlobal(
    node: VariableDeclarationStatementNode,
    currentScope: Scope,
    llvm: LLVM,
    symbol: VariableSymbol,
    llvmType: llvm.Type,
  ): boolean {
    const zeroInit = llvm.ll.Constant.getNullValue(llvmType);
    const globalVar = new llvm.ll.GlobalVariable(
      llvm.module,
      llvmType,
      false, // writable during initialization
      llvm.ll.GlobalValue.LinkageTypes.ExternalLinkage,
      zeroInit,
      symbol.mangledName,
    );
    llvm.defineSymbol(symbol, globalVar);

    const initFunc = llvm.module.getFunction("kina_program_init");
    if (!initFunc)
      throw new KinaAssertionError("Global initializer function not found");

    const currentBlock = llvm.builder.GetInsertBlock();
    llvm.builder.SetInsertPoint(initFunc.getEntryBlock());

    llvm.clearTemporaryReleaseQueue();

    let wantedType = llvmType;
    if (node.value.kind === NodeKind.StructLiteralExpression)
      wantedType = LLVMTypeTranslator.getStructType(
        llvm,
        node.type,
        currentScope,
      );

    const value = KinaIRBuilder.parseExpression(
      node.value,
      currentScope,
      llvm,
      wantedType,
    );
    llvm.builder.CreateStore(value, globalVar);

    const varSymbol = symbol as VariableSymbol;
    const varType = varSymbol.type;

    if (varType === TokenKind.TypeString) {
      const charPtr = llvm.builder.CreateExtractValue(value, [0]);
      KinaRuntimeArcMem.retain(llvm, charPtr);
    } else if (typeof varType === "string" && varType.startsWith("udt.")) {
      if (node.value.kind !== NodeKind.StructLiteralExpression)
        KinaRuntimeArcMem.retain(llvm, value);
    }

    llvm.flushTemporaryReleaseQueue();

    if (currentBlock) llvm.builder.SetInsertPoint(currentBlock);
    else llvm.builder.ClearInsertionPoint();

    return true;
  }
}
