import { LLVMContext } from "../context";

export function LLVMCall(ctx: LLVMContext) {
  return class LLVMCall {
    private readonly _name: string;
    private readonly _parameters: {
      type: string;
      value: string;
    }[];
    private readonly _returnType: string;

    constructor(
      name: string,
      parameters: {
        type: string;
        value: string;
      }[],
      returnType: string,
    ) {
      this._name = name;
      this._parameters = parameters;
      this._returnType = returnType;
    }

    stringify(): string {
      // Name should not be mangled, that is responsibility of
      // caller! - because functions are mangled and externs are not yet.
      return `call ${this._returnType} ${this._name}(${this._parameters.map((p) => `${p.type} ${p.value}`).join(", ")})`;
    }

    public get returnType() {
      return this._returnType;
    }
  };
}

export type LLVMCallConstructor = ReturnType<typeof LLVMCall>;
export type LLVMCallInstance = InstanceType<LLVMCallConstructor>;
