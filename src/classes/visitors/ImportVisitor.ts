import { NodeKind } from "@kina-lang/ast";
import { BaseVisitor, type IFirstPassVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";
import type { ImportNode } from "@kina-lang/ast/src/classes/nodes/Import";
import type { ImportedFunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/ImportedFunctionSymbol";

export class ImportVisitor
  extends BaseVisitor<ImportNode>
  implements IFirstPassVisitor<ImportNode>
{
  override visit(node: ImportNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.Import) return false;

    // no-op - already registred in first pass

    return true;
  }

  public firstPass(node: ImportNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.Import) return false;

    for (const identifier of node.members) {
      const symbol = currentScope.lookup(
        identifier.name,
      ) as ImportedFunctionSymbol;
      if (!symbol)
        throw new KinaAssertionError(
          `Symbol ${identifier.name} not found in scope`,
        );

      const returnType = LLVMTypeTranslator.kinaToLLVM(llvm, symbol.returnType);
      const paramTypes = symbol.parameterTypes.map((type) =>
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
    }

    return true;
  }
}
