import type { BasicBlockNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import { BaseBuilder } from "./_base";
import { KinaAssertionError } from "@kina-lang/utils";
import type { BasicBlockSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/BasicBlockSymbol";
import { KinaIRBuilder } from "../KinaIRBuilder";

export class BasicBlockBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: BasicBlockNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentDefinition;
    if (!parent)
      throw new Error("Basic block must be created in a function definition");

    const bbSymbol = rootScope.lookup(node.name);
    if (!bbSymbol) throw new KinaAssertionError("Basic block scope not found");

    const bbScope = (bbSymbol as BasicBlockSymbol).scope;

    const bb = parent.createBasicBlock(node.name);
    builder.setCurrentBasicBlock(bb);

    for (const childNode of node.nodes) {
      KinaIRBuilder.processNode(childNode, bbScope, builder);
    }
  }
}
