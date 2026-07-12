import { NodeKind } from "@kina-lang/ast";
import { BaseVisitor, type IFirstPassVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";
import type { ImportNode } from "@kina-lang/ast/src/classes/nodes/Import";
import type { ImportedFunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/ImportedFunctionSymbol";
import { SymbolKind } from "@kina-lang/semantic-analyzer/src/types/symbol";
import type { ImportedVariableSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/ImportedVariableSymbol";
import type { StructSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/StructSymbol";
import type { KinaType } from "../../types/kina/types";

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
      const symbol = currentScope.lookup(identifier.name);
      if (!symbol)
        throw new KinaAssertionError(
          `Symbol ${identifier.name} not found in scope`,
        );

      if (symbol.kind === SymbolKind.ImportedFunction) {
        const fnSymbol = symbol as ImportedFunctionSymbol;
        const returnType = LLVMTypeTranslator.kinaToLLVM(
          llvm,
          fnSymbol.returnType as KinaType,
          currentScope,
        );
        const paramTypes = fnSymbol.parameterTypes.map((type) =>
          LLVMTypeTranslator.kinaToLLVM(llvm, type as KinaType, currentScope),
        );
        const functionType = llvm.ll.FunctionType.get(
          returnType,
          paramTypes,
          false,
        );

        llvm.ll.Function.Create(
          functionType,
          llvm.ll.Function.LinkageTypes.ExternalLinkage,
          fnSymbol.mangledName,
          llvm.module,
        );
      } else if (symbol.kind === SymbolKind.ImportedVariable) {
        const varSymbol = symbol as ImportedVariableSymbol;
        const llvmType = LLVMTypeTranslator.kinaToLLVM(
          llvm,
          varSymbol.type as KinaType,
          currentScope,
        );
        const externalGlobal = new llvm.ll.GlobalVariable(
          llvm.module,
          llvmType,
          false, // isConstant
          llvm.ll.GlobalValue.LinkageTypes.ExternalLinkage,
          null, // pass null for external declaration
          varSymbol.mangledName,
        );

        llvm.defineSymbol(varSymbol, externalGlobal);
      } else if (symbol.kind === SymbolKind.Struct) {
        const structSymbol = symbol as StructSymbol;
        const type = llvm.ll.StructType.create(
          llvm.context,
          structSymbol.mangledName,
        );
        llvm.registerStructType(structSymbol.mangledName, type);

        const fieldTypes = structSymbol.fields.map((field) =>
          LLVMTypeTranslator.kinaToLLVM(llvm, field.type, currentScope),
        );
        type.setBody(fieldTypes);
      } else
        throw new KinaAssertionError(
          `Unsupported imported symbol kind: ${symbol.kind}`,
        );
    }

    return true;
  }
}
