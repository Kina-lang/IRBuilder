import type { LLVMContext } from "./LLVMContext";
import type { LLVMDefinition } from "./instructions/LLVMDefinition";
import { LLVMModule } from "./instructions/LLVMModule";

export class LLVMBuilder {
  private readonly _ctx: LLVMContext;
  private readonly _modules: Set<LLVMModule> = new Set([]);
  private _currentModule: LLVMModule | null = null;
  private _currentDefinition: LLVMDefinition | null = null;

  constructor(ctx: LLVMContext) {
    this._ctx = ctx;
  }

  public get ctx() {
    return this._ctx;
  }

  public setCurrentModule(mod: LLVMModule | null) {
    this._currentModule = mod;
  }

  public setCurrentDefinition(def: LLVMDefinition | null) {
    this._currentDefinition = def;
  }

  public get currentModule(): LLVMModule | null {
    return this._currentModule;
  }

  public get currentDefinition(): LLVMDefinition | null {
    return this._currentDefinition;
  }

  public createModule(name: string) {
    const mod = new LLVMModule(this, name);
    this._modules.add(mod);
    this._currentModule = mod;

    return mod;
  }

  public export(): string {
    let output = "";

    for (const module of this._modules) {
      output += module.export();
    }

    return output.trim();
  }
}
