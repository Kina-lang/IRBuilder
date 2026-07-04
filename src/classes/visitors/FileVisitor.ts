import { NodeKind, type FileNode } from "@kina-lang/ast";
import { BaseVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaIRBuilder } from "../KinaIRBuilder";

export class FileVisitor extends BaseVisitor<FileNode> {
  override visit(node: FileNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.File) return false;

    for (const child of node.nodes) {
      KinaIRBuilder.processNode(child, currentScope, llvm);
    }

    return true;
  }
}
