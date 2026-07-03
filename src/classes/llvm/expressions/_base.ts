import type { LLVMBuilder } from "../LLVMBuilder";

export abstract class LLVMBaseExpression {
  protected readonly _builder: LLVMBuilder;

  constructor(builder: LLVMBuilder) {
    this._builder = builder;
  }

  public abstract usage(): string;
  public abstract prefix(): string; 
}
