import type { LLVMLocalName, LLVMName } from "../../../types/llvm/names";
import type { LLVMBaseExpression } from "../expressions/_base";
import type { LLVMBuilder } from "../LLVMBuilder";
import { LLVMBaseInstruction } from "./_base";
import { LLVMReturn } from "./LLVMReturn";
import { LLVMSSARegister } from "./LLVMSSARegister";
import { randomBytes } from "crypto";
import { LLVMTypes } from "../helpers/LLVMTypes";
import { LLVMCall } from "../expressions/LLVMCall";
import { LLVMVoid } from "../expressions/LLVMVoid";
import { LLVMIdentifier } from "../expressions/LLVMIdentifier";

export class LLVMBasicBlock extends LLVMBaseInstruction {
  private readonly _name: string;

  constructor(builder: LLVMBuilder, name: string) {
    super(builder);

    this._name = name;
  }

  protected override getPostPrefix(): string {
    return `${this._name}:\n`;
  }

  public createReturn(valueExpression: LLVMBaseExpression): LLVMReturn {
    const i = new LLVMReturn(this._builder, valueExpression);
    this.addInstruction(i);

    return i;
  }

  public createSsaRegister(
    name: LLVMLocalName,
    valueExpression: LLVMBaseExpression,
  ) {
    const i = new LLVMSSARegister(this._builder, name, valueExpression);
    this.addInstruction(i);

    return i;
  }

  protected override shouldIndentChildren(): boolean {
    return true;
  }

  public findRegister(name: LLVMName): LLVMSSARegister | undefined {
    for (const child of this._children) {
      if (child instanceof LLVMSSARegister && child.name === name) return child;
    }

    return undefined;
  }

  public flatten(expr: LLVMBaseExpression): LLVMBaseExpression {
    if (!(expr instanceof LLVMCall)) return expr;

    if (expr.returnType === LLVMTypes.void) {
      this.addInstruction(expr.usage() + "\n");

      return new LLVMVoid(this._builder);
    } else {
      const tempName = this._builder.ctx.llvmLocalName(
        "t" + randomBytes(8).toString("hex"),
      );
      const reg = this.createSsaRegister(tempName, expr);

      return new LLVMIdentifier(this._builder, reg);
    }
  }

  public override addInstruction(
    instruction: LLVMBaseInstruction | string,
  ): void {
    super.addInstruction(instruction);
  }
}
