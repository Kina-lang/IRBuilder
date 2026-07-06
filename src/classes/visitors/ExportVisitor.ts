import { ExportNode, NodeKind } from "@kina-lang/ast";
import { BaseVisitor, type IFirstPassVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaIRBuilder } from "../KinaIRBuilder";
import type { IVisitMeta } from "../../types/meta";
import { KinaAssertionError } from "@kina-lang/utils";

export class ExportVisitor
  extends BaseVisitor<ExportNode>
  implements IFirstPassVisitor<ExportNode>
{
  override visit(node: ExportNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.Export) return false;

    KinaIRBuilder.processNode(node.target, currentScope, llvm);

    return true;
  }

  public firstPass(
    node: ExportNode,
    currentScope: Scope,
    llvm: LLVM,
    meta?: Partial<IVisitMeta>,
  ): boolean {
    if (node.kind !== NodeKind.Export) return false;

    if (meta && meta.isExported == true)
      throw new KinaAssertionError("Exported node cannot be exported again");

    KinaIRBuilder.firstPass(node.target, currentScope, llvm, {
      ...meta,
      isExported: true,
    });

    return true;
  }
}
