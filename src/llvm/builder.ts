import type { LLVMContext } from "./context";
import {
  LLVMBasicBlock,
  type LLVMBasicBlockConstructor,
} from "./objects/basic_block";
import { LLVMCall, type LLVMCallConstructor } from "./objects/call";
import { LLVMExtern, type LLVMExternConstructor } from "./objects/extern";
import {
  LLVMFunction,
  type LLVMFunctionConstructor,
  type LLVMFunctionInstance,
} from "./objects/function";
import {
  LLVMReturnStatement,
  type LLVMReturnStatementConstructor,
} from "./objects/return";
import {
  LLVMVarAssignment,
  type LLVMVarAssignmentConstructor,
} from "./objects/var_assignment";

export class LLVMBuilder {
  private readonly _context: LLVMContext;

  public readonly function: LLVMFunctionConstructor;
  public readonly basicBlock: LLVMBasicBlockConstructor;
  public readonly returnStatement: LLVMReturnStatementConstructor;
  public readonly extern: LLVMExternConstructor;
  public readonly call: LLVMCallConstructor;
  public readonly varAssignment: LLVMVarAssignmentConstructor;

  constructor(context: LLVMContext) {
    this._context = context;

    this.function = LLVMFunction(this._context);
    this.basicBlock = LLVMBasicBlock(this._context);
    this.returnStatement = LLVMReturnStatement(this._context);
    this.extern = LLVMExtern(this._context);
    this.call = LLVMCall(this._context);
    this.varAssignment = LLVMVarAssignment(this._context);
  }

  public build(): string {
    const chunks: string[] = [];

    for (const obj of this._context.getAll()) {
      const res: string[] | string = obj.stringify();

      if (typeof res == "string") chunks.push(res);
      else chunks.push(res.join("\n"));
    }

    return chunks.join("\n");
  }
}
