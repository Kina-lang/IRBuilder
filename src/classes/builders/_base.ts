import type { BaseNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";

export abstract class BaseBuilder {
  abstract process(
    node: BaseNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void;
}
