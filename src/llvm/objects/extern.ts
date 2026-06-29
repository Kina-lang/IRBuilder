import { llvmGlobalVar } from "../../utils/var";
import { LLVMContext } from "../context";

export function LLVMExtern(ctx: LLVMContext) {
  return class LLVMExtern {
    private readonly _name: string;
    private readonly _parameterTypes: string[];
    private readonly _returnType: string;

    constructor(name: string, parameterType: string[], returnType: string) {
      this._name = name;
      this._parameterTypes = parameterType;
      this._returnType = returnType;

      ctx.add(this);
    }

    stringify(): string[] {
      // TODO: Add mangling?
      return [
        `declare ${this._returnType} ${llvmGlobalVar(this._name)}(${this._parameterTypes.join(", ")})`,
      ];
    }
  };
}

export type LLVMExternConstructor = ReturnType<typeof LLVMExtern>;
export type LLVMExternInstance = InstanceType<LLVMExternConstructor>;
