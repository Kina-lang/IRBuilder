import { NodeKind, type ExternNode } from "@kina-lang/ast";
import { BaseVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";

export class ExternVisitor extends BaseVisitor<ExternNode> {
  override visit(node: ExternNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.Extern) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const returnType = LLVMTypeTranslator.kinaToLLVM(llvm, node.returnType);
    const paramTypes = node.parameterTypes.map((type) =>
      LLVMTypeTranslator.kinaToLLVM(llvm, type),
    );
    const functionType = llvm.ll.FunctionType.get(
      returnType,
      paramTypes,
      false,
    );

    const externFunc = llvm.ll.Function.Create(
      functionType,
      llvm.ll.Function.LinkageTypes.ExternalLinkage,
      symbol.mangledName,
      llvm.module,
    );

    return true;
  }
}
