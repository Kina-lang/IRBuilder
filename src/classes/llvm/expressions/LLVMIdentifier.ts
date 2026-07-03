import type { LLVMType } from "../../../types/llvm/types";
import type { LLVMDeclaration } from "../instructions/LLVMDeclaration";
import type { LLVMDefinition } from "../instructions/LLVMDefinition";
import type { LLVMSSARegister } from "../instructions/LLVMSSARegister";
import type { LLVMParameter } from "../helpers/LLVMParameter";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseExpression } from "./_base";

export class LLVMIdentifier extends LLVMBaseExpression {
  private readonly _resolved:
    | LLVMDefinition
    | LLVMDeclaration
    | LLVMSSARegister
    | LLVMParameter;

  constructor(
    builder: LLVMBuilder,
    resolved:
      | LLVMDefinition
      | LLVMDeclaration
      | LLVMSSARegister
      | LLVMParameter,
  ) {
    super(builder);
    this._resolved = resolved;
  }

  public override prefix(): string {
    return "";
  }

  public override usage(): string {
    return `${(this._resolved as LLVMDefinition | LLVMDeclaration | LLVMSSARegister | LLVMParameter).usage()}`;
  }

  public override get type(): LLVMType {
    return this._resolved.type;
  }

  public override get returnType(): LLVMType {
    return "returnType" in this._resolved
      ? (this._resolved.returnType as LLVMType)
      : this._resolved.type;
  }
}
