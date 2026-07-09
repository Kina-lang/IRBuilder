import { NodeKind, type BasicBlockNode } from "@kina-lang/ast";
import { BaseVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaIRBuilder } from "../KinaIRBuilder";
import type { BasicBlockSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/BasicBlockSymbol";
import { KinaRuntimeArcMem } from "../runtime/KinaRuntimeArcMem";

export class BasicBlockVisitor extends BaseVisitor<BasicBlockNode> {
  override visit(
    node: BasicBlockNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind !== NodeKind.BasicBlock) return false;

    const currentFunction = llvm.activeFunction;
    if (!currentFunction)
      throw new KinaAssertionError("No active function found for basic block");

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const blockScope = (symbol as BasicBlockSymbol).scope as Scope;

    // Just process children
    // don't create a new basic block, as this is the responsibility of
    // function/if/while/... visitors to handle for themselves
    for (const child of node.nodes) {
      KinaIRBuilder.processNode(child, blockScope, llvm);
    }

    KinaRuntimeArcMem.releaseScopeVariables(llvm, blockScope);

    return true;
  }
}
