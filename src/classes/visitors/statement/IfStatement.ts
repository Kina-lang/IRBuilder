import { NodeKind, type IfStatementNode } from "@kina-lang/ast";
import { BaseVisitor } from "../_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import type { BasicBlockSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/BasicBlockSymbol";
import { randomBytes } from "crypto";

export class IfStatementVisitor extends BaseVisitor<IfStatementNode> {
  constructor() {
    super();
  }

  override visit(
    node: IfStatementNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind != NodeKind.IfStatement) return false;

    const originalBB = llvm.builder.GetInsertBlock();
    if (!originalBB)
      throw new KinaAssertionError("Current basic block is null.");

    const currentFunction = llvm.activeFunction;
    if (!currentFunction)
      throw new KinaAssertionError(
        "No active function found for if statement.",
      );

    const conditionVal = KinaIRBuilder.parseExpression(
      node.condition,
      currentScope,
      llvm,
      llvm.builder.getInt1Ty(),
    );

    const thenBBSymbol = currentScope.lookup(node.thenBlock.name);
    const elseBBSymbol = node.elseBlock
      ? currentScope.lookup(node.elseBlock.name)
      : null;

    if (!thenBBSymbol)
      throw new KinaAssertionError(
        `Basic block ${node.thenBlock.name} not found in scope`,
      );
    if (node.elseBlock && !elseBBSymbol)
      throw new KinaAssertionError(
        `Basic block ${node.elseBlock.name} not found in scope`,
      );

    const thenBBScope = (thenBBSymbol as BasicBlockSymbol).scope as Scope;
    const elseBBScope =
      node.elseBlock && ((elseBBSymbol as BasicBlockSymbol).scope as Scope);

    const thenBB = llvm.ll.BasicBlock.Create(
      llvm.context,
      thenBBSymbol.mangledName,
      currentFunction,
    );
    const elseBB = node.elseBlock
      ? llvm.ll.BasicBlock.Create(
          llvm.context,
          elseBBSymbol!.mangledName,
          currentFunction,
        )
      : null;

    const mergeBB = llvm.ll.BasicBlock.Create(
      llvm.context,
      `Z${randomBytes(8).toString("hex")}`,
      currentFunction,
    );

    // Create branch into then & else (fallback to merge if no else block)
    llvm.builder.CreateCondBr(conditionVal, thenBB, elseBB ?? mergeBB);

    // Set insert point to then block and process it
    llvm.builder.SetInsertPoint(thenBB);
    KinaIRBuilder.processNode(node.thenBlock, thenBBScope, llvm);

    // Create branch to merge block after then block
    llvm.builder.CreateBr(mergeBB);

    // If there is an else block, set insert point to it and process it
    if (elseBB) {
      llvm.builder.SetInsertPoint(elseBB);
      KinaIRBuilder.processNode(node.elseBlock!, elseBBScope!, llvm);

      // Create branch to merge block after else block
      llvm.builder.CreateBr(mergeBB);
    }

    // Set insert point to merge block
    llvm.builder.SetInsertPoint(mergeBB);

    return true;
  }
}
