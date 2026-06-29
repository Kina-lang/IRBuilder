import { llvmGlobalVar, llvmLocalVar } from "../../objects/utils/var";
import type { LLVMVarRightSide, LLVMObject } from "../../types/llvm";
import { LLVMContext } from "../context";

export function LLVMVarAssignment(ctx: LLVMContext) {
  return class LLVMVarAssignment {
    private readonly _name: string;
    private readonly _rightSide: LLVMVarRightSide;
    private readonly _isGlobal: boolean;

    constructor(
      name: string,
      rightSide: LLVMVarRightSide,
      isGlobal: boolean = false,
    ) {
      this._name = name;
      this._rightSide = rightSide;
      this._isGlobal = isGlobal;
    }

    stringify(): string {
      return `${this._isGlobal ? llvmGlobalVar(this._name) : llvmLocalVar(this._name)} = ${this._rightSide.stringify()}`;
    }

    public get fullName() {
      return this._isGlobal
        ? llvmGlobalVar(this._name)
        : llvmLocalVar(this._name);
    }

    public get type() {
      return this._rightSide.returnType;
    }
  };
}

export type LLVMVarAssignmentConstructor = ReturnType<typeof LLVMVarAssignment>;
export type LLVMVarAssignmentInstance =
  InstanceType<LLVMVarAssignmentConstructor>;
