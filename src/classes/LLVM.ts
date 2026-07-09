import llvm from "@designliquido/llvm-bindings";
import { LLVMAlias } from "./llvm/LLVMAlias";
import type { BaseSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/_base";
import { KinaAssertionError } from "@kina-lang/utils";

export class LLVM {
  private readonly _context: llvm.LLVMContext;
  private readonly _module: llvm.Module;
  private readonly _builder: llvm.IRBuilder;

  private _activeFunction: llvm.Function | null = null;
  private _activeFunctionSymbolMap: Map<BaseSymbol, llvm.Value> | null = null;

  private readonly _structTypes: Map<string, llvm.StructType> = new Map();

  private readonly _aliases: LLVMAlias[] = [];

  constructor(moduleId: string) {
    this._context = new llvm.LLVMContext();
    this._module = new llvm.Module(moduleId, this._context);
    this._builder = new llvm.IRBuilder(this._context);
  }

  public createFunctionAlias(
    aliasName: string,
    funcType: string,
    funcName: string,
  ) {
    const alias = new LLVMAlias(aliasName, funcType, `ptr @${funcName}`);
    this._aliases.push(alias);
  }

  public get builder() {
    return this._builder;
  }

  public get module() {
    return this._module;
  }

  public get context() {
    return this._context;
  }

  public get ll() {
    return llvm;
  }

  public setActiveFunction(func: llvm.Function | null) {
    this._activeFunction = func;

    if (!func) this._activeFunctionSymbolMap = null;
    else this._activeFunctionSymbolMap = new Map([]);
  }

  public get activeFunction() {
    return this._activeFunction;
  }

  public defineSymbol(symbol: BaseSymbol, value: llvm.Value) {
    if (!this._activeFunctionSymbolMap)
      throw new KinaAssertionError("No active function to define symbol in");

    this._activeFunctionSymbolMap.set(symbol, value);
  }

  public lookupSymbol(symbol: BaseSymbol): llvm.Value | undefined {
    if (!this._activeFunctionSymbolMap)
      throw new KinaAssertionError("No active function to lookup symbol in");

    return this._activeFunctionSymbolMap.get(symbol);
  }

  public registerStructType(name: string, type: llvm.StructType) {
    this._structTypes.set(name, type);
  }

  public getStructType(name: string): llvm.StructType | undefined {
    return this._structTypes.get(name);
  }

  public emit() {
    return (
      this._module.print() +
      "\n" +
      this._aliases.map((alias) => alias.emit()).join("\n")
    );
  }
}
