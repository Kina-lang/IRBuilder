import llvm from "@designliquido/llvm-bindings";
import { LLVMAlias } from "./llvm/LLVMAlias";

export class LLVM {
  private readonly _context: llvm.LLVMContext;
  private readonly _module: llvm.Module;
  private readonly _builder: llvm.IRBuilder;

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

  public emit() {
    return (
      this._module.print() +
      "\n" +
      this._aliases.map((alias) => alias.emit()).join("\n")
    );
  }
}
