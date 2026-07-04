import type { BaseNode } from "@kina-lang/ast";
import type { LLVM } from "../LLVM";
import type { Scope } from "@kina-lang/semantic-analyzer";

export abstract class BaseVisitor<T extends BaseNode = BaseNode> {
  abstract visit(node: T, currentScope: Scope, llvm: LLVM): boolean;
}
