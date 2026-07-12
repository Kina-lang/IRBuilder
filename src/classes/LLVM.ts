import llvm from "@designliquido/llvm-bindings";
import { LLVMAlias } from "./llvm/LLVMAlias";
import type { BaseSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/_base";
import { KinaRuntimeArcMem } from "./runtime/KinaRuntimeArcMem";
import type { FunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/FunctionSymbol";
import type { KinaCompiler } from "@kina-lang/compiler";

export class LLVM {
  private readonly _context: llvm.LLVMContext;
  private readonly _module: llvm.Module;
  private readonly _builder: llvm.IRBuilder;

  private _activeFunction: llvm.Function | null = null;
  private _activeFunctionSymbol: FunctionSymbol | null = null;
  private _activeFunctionSymbolMap: Map<BaseSymbol, llvm.Value> | null = null;
  private readonly _globalSymbolMap: Map<BaseSymbol, llvm.Value> = new Map();

  private readonly _structTypes: Map<string, llvm.StructType> = new Map();

  private readonly _aliases: LLVMAlias[] = [];
  private readonly _temporaryReleaseQueue: Set<llvm.Value> = new Set();

  private readonly _compiler: KinaCompiler;

  constructor(moduleId: string, compiler: KinaCompiler) {
    this._context = new llvm.LLVMContext();
    this._module = new llvm.Module(moduleId, this._context);
    this._builder = new llvm.IRBuilder(this._context);
    this._compiler = compiler;
  }

  public get compiler(): KinaCompiler {
    return this._compiler;
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

  public setActiveFunction(
    func: llvm.Function | null,
    symbol: FunctionSymbol | null = null,
  ) {
    this._activeFunction = func;
    this._activeFunctionSymbol = symbol;

    if (!func) this._activeFunctionSymbolMap = null;
    else this._activeFunctionSymbolMap = new Map([]);
  }

  public get activeFunction() {
    return this._activeFunction;
  }

  public get activeFunctionSymbol(): FunctionSymbol | null {
    return this._activeFunctionSymbol;
  }

  public defineSymbol(symbol: BaseSymbol, value: llvm.Value) {
    if (this._activeFunctionSymbolMap)
      this._activeFunctionSymbolMap.set(symbol, value);
    else this._globalSymbolMap.set(symbol, value);
  }

  public lookupSymbol(symbol: BaseSymbol): llvm.Value | undefined {
    if (
      this._activeFunctionSymbolMap &&
      this._activeFunctionSymbolMap.has(symbol)
    )
      return this._activeFunctionSymbolMap.get(symbol);

    return this._globalSymbolMap.get(symbol);
  }

  public registerStructType(name: string, type: llvm.StructType) {
    this._structTypes.set(name, type);
  }

  public getStructType(name: string): llvm.StructType | undefined {
    return this._structTypes.get(name);
  }

  public queueTemporaryForRelease(value: llvm.Value) {
    this._temporaryReleaseQueue.add(value);
  }

  public exemptTemporaryFromRelease(value: llvm.Value) {
    this._temporaryReleaseQueue.delete(value);
  }

  public flushTemporaryReleaseQueue() {
    for (const value of this._temporaryReleaseQueue) {
      KinaRuntimeArcMem.release(this, value);
    }

    this._temporaryReleaseQueue.clear();
  }

  public clearTemporaryReleaseQueue() {
    this._temporaryReleaseQueue.clear();
  }

  public emit() {
    return (
      this._module.print() +
      "\n" +
      this._aliases.map((alias) => alias.emit()).join("\n")
    );
  }
}
