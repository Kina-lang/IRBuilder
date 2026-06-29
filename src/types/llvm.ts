import type {
  LLVMCallConstructor,
  LLVMCallInstance,
} from "../llvm/objects/call";
import type { LLVMExternInstance } from "../llvm/objects/extern";
import type { LLVMFunctionInstance } from "../llvm/objects/function";
import type { LLVMReturnStatementInstance } from "../llvm/objects/return";

export type LLVMStatementObject = LLVMReturnStatementInstance;
export type LLVMObject = LLVMFunctionInstance | LLVMExternInstance;
export type LLVMVarRightSide = LLVMCallInstance;
