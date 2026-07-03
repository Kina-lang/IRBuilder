import type { LLVMGlobalString } from "./LLVMGlobalString";

export class LLVMContext {
  private readonly _strings: Map<string, LLVMGlobalString> = new Map([]);

  constructor() {}
}
