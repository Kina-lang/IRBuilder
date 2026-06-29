import type { LLVMObject } from "../types/llvm";

export class LLVMContext {
  private readonly _objects: LLVMObject[] = [];

  constructor() {}

  add(obj: LLVMObject) {
    this._objects.push(obj);
  }

  getAll(): LLVMObject[] {
    return this._objects;
  }
}
