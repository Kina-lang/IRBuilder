import { KinaAssertionError } from "@kina-lang/utils";
import type { LLVMGlobalName, LLVMLocalName } from "../../types/llvm/names";
import type { LLVMGlobalString } from "./LLVMGlobalString";
import type { KinaType } from "../../types/kina/types";
import type { LLVMType } from "../../types/llvm/types";
import { KinaToLLVMTypeMap } from "../../constants/types";
import type { LiteralExpressionNode } from "@kina-lang/ast";
import { TokenKind } from "@kina-lang/lexer";
import { LLVMTypes } from "./helpers/LLVMTypes";

export class LLVMContext {
  private readonly _strings: Map<string, LLVMGlobalString> = new Map([]);
  private readonly _globalNames: Set<LLVMGlobalName> = new Set([]);

  private readonly _llvmLiteralIntegerTypes: Set<LLVMType> = new Set([
    LLVMTypes.int32,
  ]);

  constructor() {}

  public llvmGlobalName(name: string): LLVMGlobalName {
    const globalName = `@${name}` as LLVMGlobalName;

    if (!this._globalNames.has(globalName)) this._globalNames.add(globalName);

    return globalName;
  }

  public llvmLocalName(name: string): LLVMLocalName {
    // TODO: Add collision detection for local names (somehow)
    return `%${name}` as LLVMLocalName;
  }

  public kinaToLlvmType(kinaType: KinaType): LLVMType {
    if (!(kinaType in KinaToLLVMTypeMap))
      throw new KinaAssertionError(`Kina type ${kinaType} is not supported`);

    return KinaToLLVMTypeMap[kinaType];
  }

  // TODO: Move this responsibility to the semantic analyzer?
  public resolveLlvmLiteralType(
    literalNode: LiteralExpressionNode,
    wantedType: LLVMType | null,
  ): LLVMType {
    switch (literalNode.literalType) {
      case TokenKind.LiteralInteger:
        if (!wantedType) return LLVMTypes.int32;
        if (!this._llvmLiteralIntegerTypes.has(wantedType))
          throw new KinaAssertionError(
            `Wanted type ${wantedType} is not valid for integer literals`,
          );
        return wantedType;
      default:
        throw new KinaAssertionError(
          `Unsupported literal type: ${literalNode.literalType}`,
        );
    }
  }
}
