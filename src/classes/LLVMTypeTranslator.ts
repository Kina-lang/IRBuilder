import { PrimitiveTypeNode, type TypeBaseNode } from "@kina-lang/ast";
import type { KinaType } from "../types/kina/types";
import { TokenKind } from "@kina-lang/lexer";
import type { LLVM } from "./LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { KinaAssertionError } from "@kina-lang/utils";

export class LLVMTypeTranslator {
  public static readonly llvmTypeIntegerWidths = [32];

  constructor() {}

  static kinaToLLVM(llvm: LLVM, kinaType: KinaType | TypeBaseNode): llvm.Type {
    if (kinaType instanceof PrimitiveTypeNode) {
      kinaType = kinaType.primitiveKind;
    }

    if (kinaType == TokenKind.TypeVoid) return llvm.builder.getVoidTy();
    if (kinaType == TokenKind.TypeInt) return llvm.builder.getInt32Ty();
    if (kinaType == TokenKind.TypeBool) return llvm.builder.getInt1Ty();
    if (kinaType == TokenKind.TypePtr) return llvm.builder.getPtrTy();
    if (kinaType == TokenKind.TypeString || kinaType === '___kina_internal_string') {
      // First struct prop is pointer to string value, second struct prop is length of string
      const charPtrTy = llvm.builder.getPtrTy();
      const lenTy = llvm.builder.getInt32Ty();

      return llvm.ll.StructType.get(llvm.context, [charPtrTy, lenTy]);
    }

    throw new KinaAssertionError(`Unsupported Kina type: ${kinaType}`);
  }
}
