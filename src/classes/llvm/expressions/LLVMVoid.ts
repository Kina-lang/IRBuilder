import type { LLVMType } from "../../../types/llvm/types";
import { LLVMTypes } from "../helpers/LLVMTypes";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMVoid extends LLVMBaseExpression {
  constructor(builder: LLVMBuilder) {
    super(builder);
  }

  public override prefix(): string {
    return "";
  }

  public override usage(): string {
    return "void";
  }

  public override get type(): LLVMType {
    return LLVMTypes.void;
  }
}
