import { MemberAccessExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaIRBuilder } from "../../KinaIRBuilder";

export class MemberAccessExpressionParser extends ExpressionParser<MemberAccessExpressionNode> {
  override parse(
    node: MemberAccessExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const objectVal = KinaIRBuilder.parseExpression(
      node.object,
      currentScope,
      llvm,
      null,
    );

    if (node.property === "___kina_internal")
      return objectVal;

    if (node.property === "length")
      return llvm.builder.CreateExtractValue(objectVal, [1]);

    if (node.property === "pointer")
      return llvm.builder.CreateExtractValue(objectVal, [0]);

    throw new KinaAssertionError(
      `Unsupported member access property: ${node.property}`,
    );
  }
}
