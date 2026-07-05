import type { IdentifierExpressionNode } from "@kina-lang/ast";
import { ExpressionParser } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { SymbolKind } from "@kina-lang/semantic-analyzer/src/types/symbol";
import type { VariableSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/VariableSymbol";
import type llvm from "@designliquido/llvm-bindings";
import { LLVMTypeTranslator } from "../../LLVMTypeTranslator";
import type { FunctionParameterSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/FunctionParameterSymbol";
import type { ExternSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/ExternSymbol";

export class IdentifierExpressionParser extends ExpressionParser<IdentifierExpressionNode> {
  override parse(
    node: IdentifierExpressionNode,
    currentScope: Scope,
    llvm: LLVM,
    wantedType: llvm.Type | null,
  ): llvm.Value {
    const symbol = currentScope.lookup(node.name);
    if (!symbol) throw new KinaAssertionError(`Symbol not found: ${node.name}`);

    if (symbol.kind == SymbolKind.Variable)
      return this.parseVariableAccess(symbol as VariableSymbol, llvm);
    if (symbol.kind == SymbolKind.FunctionParameter)
      return this.parseFunctionParameterAccess(
        symbol as FunctionParameterSymbol,
        llvm,
      );
    if (
      symbol.kind == SymbolKind.Extern ||
      symbol.kind == SymbolKind.Function ||
      symbol.kind == SymbolKind.ImportedFunction
    )
      return this.parseFunctionAccess(symbol as ExternSymbol, llvm);

    throw new KinaAssertionError(
      `Using this type of symbol as value is not supported yet: ${symbol.kind}`,
    );
  }

  private parseVariableAccess(symbol: VariableSymbol, llvm: LLVM): llvm.Value {
    const alloca = llvm.lookupSymbol(symbol);
    if (!alloca)
      throw new KinaAssertionError(
        `LLVM value not found for symbol: ${symbol.name}`,
      );

    const llvmType = LLVMTypeTranslator.kinaToLLVM(llvm, symbol.type);
    const load = llvm.builder.CreateLoad(llvmType, alloca);

    return load;
  }

  private parseFunctionParameterAccess(
    symbol: FunctionParameterSymbol,
    llvm: LLVM,
  ): llvm.Value {
    const func = llvm.activeFunction;
    if (!func)
      throw new KinaAssertionError(
        "No active function found for function parameter access",
      );

    const paramIndex = symbol.index;
    if (paramIndex >= func.arg_size() || paramIndex < 0)
      throw new KinaAssertionError(
        `Function parameter index out of bounds: ${paramIndex}`,
      );

    const param = func.getArg(paramIndex);
    if (!param)
      throw new KinaAssertionError(
        `LLVM parameter not found for symbol: ${symbol.name}`,
      );

    return param;
  }

  private parseFunctionAccess(symbol: ExternSymbol, llvm: LLVM): llvm.Value {
    const func = llvm.module.getFunction(symbol.mangledName);
    if (!func)
      throw new KinaAssertionError(
        `LLVM function not found for symbol: ${symbol.name}`,
      );

    return func;
  }
}
