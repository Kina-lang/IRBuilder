import type { BaseNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import type { LLVMModule } from "../llvm/instructions/LLVMModule";

export abstract class BaseBuilder {
  abstract process(
    node: BaseNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    module: LLVMModule,
  ): void;
}
