import type { KinaType } from "../types/kina/types";
import { TokenKind } from "@kina-lang/lexer";
import type { LLVM } from "./LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { KinaAssertionError } from "@kina-lang/utils";

export class LLVMTypeTranslator {
  constructor() {}

  static kinaToLLVM(llvm: LLVM, kinaType: KinaType): llvm.Type {
    if (kinaType == TokenKind.TypeVoid) return llvm.builder.getVoidTy();
    if (kinaType == TokenKind.TypeInt) return llvm.builder.getInt32Ty();
    if (kinaType == TokenKind.TypeBool) return llvm.builder.getInt1Ty();

    throw new KinaAssertionError(`Unsupported Kina type: ${kinaType}`);
  }
}
