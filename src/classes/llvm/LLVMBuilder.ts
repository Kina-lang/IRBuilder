import type { LLVMContext } from "./LLVMContext";
import { LLVMModule } from "./instructions/LLVMModule";
import { LLVMComment } from "./instructions/LLVMComment";

export class LLVMBuilder {
  private readonly _ctx: LLVMContext;
  private readonly _modules: Set<LLVMModule> = new Set([]);

  constructor(ctx: LLVMContext) {
    this._ctx = ctx;
  }

  public module(name: string) {
    const mod = new LLVMModule(this, name);
    this._modules.add(mod);

    return mod;
  }
  public comment = (comment: string) => new LLVMComment(this, comment);

  public export(): string {
    let output = "";

    for (const module of this._modules) {
      output += module.export();
    }

    return output;
  }
}
