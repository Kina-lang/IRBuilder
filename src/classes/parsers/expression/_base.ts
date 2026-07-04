import type { ExpressionBaseNode } from "@kina-lang/ast/src/classes/nodes/_expression";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";

export abstract class ExpressionParser<
  T extends ExpressionBaseNode = ExpressionBaseNode,
> {
  abstract parse(
    node: T,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value;
}
