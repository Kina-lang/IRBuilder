import type { VariableDeclarationStatementNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import { LLVMAlloca } from "../../llvm/expressions/LLVMAlloca";
import { KinaAssertionError } from "@kina-lang/utils";
import { processExpression } from "../_index";
import { LLVMStore } from "../../llvm/instructions/LLVMStore";
import { LLVMIdentifier } from "../../llvm/expressions/LLVMIdentifier";

export class VariableDeclarationStatementBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: VariableDeclarationStatementNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentBasicBlock;
    if (!parent)
      throw new KinaAssertionError(
        "Variable declaration must be created in a basic block",
      );

    const symbol = rootScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(
        `Symbol not found for variable declaration: ${node.name}`,
      );

    const llvmType = builder.ctx.kinaToLlvmType(node.type);
    const alloca = new LLVMAlloca(builder, llvmType);
    const register = parent.createSsaRegister(
      builder.ctx.llvmLocalName(symbol.mangledName),
      alloca,
    );

    const rawValExpr = processExpression(node.value, rootScope, builder);
    const valExpr = parent.flatten(rawValExpr);

    const store = new LLVMStore(
      builder,
      valExpr,
      new LLVMIdentifier(builder, register),
    );
    parent.addInstruction(store);
  }
}
