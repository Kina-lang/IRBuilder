import { TokenKind } from "@kina-lang/lexer";
import type { KinaType } from "../types/kina/types";
import type { LLVMType } from "../types/llvm/types";

export const KinaToLLVMTypeMap: {
  [key in KinaType]: LLVMType;
} = {
  [TokenKind.TypeVoid]: "void" as LLVMType,
  [TokenKind.TypeInt]: "i32" as LLVMType,
  [TokenKind.TypeBool]: "bool" as LLVMType,
};
