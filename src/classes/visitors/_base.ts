import type { BaseNode } from "@kina-lang/ast";
import type { LLVM } from "../LLVM";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { IVisitMeta } from "../../types/meta";

export abstract class BaseVisitor<T extends BaseNode = BaseNode> {
  abstract visit(node: T, currentScope: Scope, llvm: LLVM): boolean;
}

export interface IFirstPassVisitor<T extends BaseNode = BaseNode> {
  firstPass(
    node: T,
    currentScope: Scope,
    llvm: LLVM,
    meta?: Partial<IVisitMeta>,
  ): boolean;
}
