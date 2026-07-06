import type { TokenKind } from "@kina-lang/lexer";

export type KinaType =
  | TokenKind.TypeBool
  | TokenKind.TypeInt
  | TokenKind.TypeVoid
  | TokenKind.TypeString
  | TokenKind.TypePtr;
