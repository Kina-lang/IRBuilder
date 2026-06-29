import { llvmGlobalVar, llvmLocalVar } from "../../objects/utils/var";
import type { LLVMBuilder } from "../builder";
import { LLVMContext } from "../context";
import type { LLVMBasicBlockInstance } from "./basic_block";

export function LLVMFunction(ctx: LLVMContext) {
  return class LLVMFunction {
    private readonly _name: string;
    private readonly _returnType: string;
    private readonly _parameters: {
      name: string;
      type: string;
    }[];
    private readonly _body: LLVMBasicBlockInstance;

    constructor(
      name: string,
      returnType: string,
      parameters: {
        name: string;
        type: string;
      }[],
      body: LLVMBasicBlockInstance,
    ) {
      this._name = name;
      this._returnType = returnType;
      this._parameters = parameters.map((p) => ({
        ...p,
        name: p.name,
      }));
      this._body = body;

      ctx.add(this);
    }

    private getParameters() {
      return this._parameters.map(
        (pt) => `${pt.type} ${llvmLocalVar(pt.name)}`,
      );
    }

    private mangleName(name: string) {
      return `k_fn_Z${name.length}${name}`;
    }

    private mangleParameter(name: string) {
      return `k_fn_param_Z${name.length}${name}`;
    }

    stringify(): string[] {
      return [
        `define ${this._returnType} ${llvmGlobalVar(this._name)}(${this.getParameters().join(", ")}) {`,
        ...this._body.stringify(),
        `}`,
      ];
    }
  };
}

export type LLVMFunctionConstructor = ReturnType<typeof LLVMFunction>;
export type LLVMFunctionInstance = InstanceType<LLVMFunctionConstructor>;
