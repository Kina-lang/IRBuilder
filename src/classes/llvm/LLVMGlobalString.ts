import { randomUUID } from "crypto";
import type { NullTerminatedString } from "../../types/llvm/string";

export class LLVMGlobalString {
  private readonly _contents: NullTerminatedString;
  private readonly _id: string;

  constructor(contents: NullTerminatedString) {
    this._contents = contents;
    this._id = randomUUID();
  }

  public get contents(): NullTerminatedString {
    return this._contents;
  }

  public get id(): string {
    return this._id;
  }

  public get length(): number {
    // The length of the string in bytes, including the null terminator
    // uses TextEncoder to get the byte length of the string (UTF-8 encoding)
    return new TextEncoder().encode(this._contents).length;
  }

  static fromString(str: string): LLVMGlobalString {
    return new this(LLVMGlobalString.nullTerminated(str));
  }

  static nullTerminated(str: string): NullTerminatedString {
    return (str + "\0") as NullTerminatedString;
  }
}
