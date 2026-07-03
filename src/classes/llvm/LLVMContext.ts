import { KinaAssertionError } from "@kina-lang/utils";
import type { LLVMGlobalName } from "../../types/llvm/names";
import type { LLVMGlobalString } from "./LLVMGlobalString";
import type { KinaType } from "../../types/kina/types";
import type { LLVMType } from "../../types/llvm/types";
import { KinaToLLVMTypeMap } from "../../constants/types";

export class LLVMContext {
  private readonly _strings: Map<string, LLVMGlobalString> = new Map([]);
  private readonly _globalNames: Set<LLVMGlobalName> = new Set([]);

  constructor() {}

  public llvmGlobalName(name: string): LLVMGlobalName {
    const globalName = `@${name}` as LLVMGlobalName;

    if (this._globalNames.has(globalName))
      throw new KinaAssertionError(`Global name ${globalName} already exists`);

    this._globalNames.add(globalName);

    return globalName;
  }

  public kinaToLlvmType(kinaType: KinaType): LLVMType {
    if (!(kinaType in KinaToLLVMTypeMap))
      throw new KinaAssertionError(`Kina type ${kinaType} is not supported`);

    return KinaToLLVMTypeMap[kinaType];
  }
}
