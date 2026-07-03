import type { LLVMContext } from "./LLVMContext";
import { LLVMModule } from "./instructions/LLVMModule";

export class LLVMBuilder {
  private readonly _ctx: LLVMContext;
  private readonly _modules: Set<LLVMModule> = new Set([]);

  constructor(ctx: LLVMContext) {
    this._ctx = ctx;
  }

  public get ctx() {
    return this._ctx;
  }

  public createModule(name: string) {
    const mod = new LLVMModule(this, name);
    this._modules.add(mod);

    return mod;
  }

  public export(): string {
    let output = "";

    for (const module of this._modules) {
      output += module.export();
    }

    return output;
  }
}
