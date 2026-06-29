import { llvmGlobalVar, llvmLocalVar } from "../../utils/var";
import type { LLVMStatementObject } from "../../types/llvm";
import { LLVMContext } from "../context";

export function LLVMBasicBlock(ctx: LLVMContext) {
  return class LLVMBasicBlock {
    private readonly _name: string;
    private readonly _objects: (LLVMStatementObject | string | string[])[];

    constructor(
      name: string,
      objects: (LLVMStatementObject | string | string[])[],
    ) {
      this._name = name;
      this._objects = objects;
    }

    stringify(): string[] {
      return [
        `${this._name}:`,
        ...this._objects.map((o) => {
          if (typeof o == "string") return o;
          if (Array.isArray(o)) return o.join("\n");

          const res = o.stringify();

          if (typeof res == "string") return res;
          else return res.join("\n");
        }),
      ];
    }
  };
}

export type LLVMBasicBlockConstructor = ReturnType<typeof LLVMBasicBlock>;
export type LLVMBasicBlockInstance = InstanceType<LLVMBasicBlockConstructor>;
