import { LLVMContext } from "../context";

export function LLVMReturnStatement(ctx: LLVMContext) {
  return class LLVMReturnStatement {
    private readonly _value: {
      name: string;
      type: string;
      instructions: string[];
    };

    constructor(value: { name: string; type: string; instructions: string[] }) {
      this._value = value;
    }

    stringify(): string[] {
      return [
        ...this._value.instructions,
        `ret ${this._value.type} ${this._value.name}`,
      ];
    }
  };
}

export type LLVMReturnStatementConstructor = ReturnType<
  typeof LLVMReturnStatement
>;
export type LLVMReturnStatementInstance =
  InstanceType<LLVMReturnStatementConstructor>;
