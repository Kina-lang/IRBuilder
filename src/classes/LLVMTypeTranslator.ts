import {
  PrimitiveTypeNode,
  UserDefinedTypeNode,
  type TypeBaseNode,
} from "@kina-lang/ast";
import type { KinaType } from "../types/kina/types";
import { TokenKind } from "@kina-lang/lexer";
import type { LLVM } from "./LLVM";
import type llvm from "@designliquido/llvm-bindings";
import { KinaAssertionError } from "@kina-lang/utils";
import type { Scope } from "@kina-lang/semantic-analyzer";

export class LLVMTypeTranslator {
  public static readonly llvmTypeIntegerWidths = [32];

  constructor() {}

  public static findStructSymbolByMangledName(
    scope: Scope,
    mangledName: string,
  ): any | null {
    for (const symbol of (scope as any)._symbols.values()) {
      if (symbol.mangledName === mangledName) return symbol;
    }

    if ((scope as any)._parent)
      return this.findStructSymbolByMangledName(
        (scope as any)._parent,
        mangledName,
      );

    return null;
  }

  static kinaToLLVM(
    llvm: LLVM,
    kinaType: KinaType | TypeBaseNode,
    scope?: Scope,
  ): llvm.Type {
    if (kinaType instanceof PrimitiveTypeNode)
      kinaType = kinaType.primitiveKind;

    if (kinaType instanceof UserDefinedTypeNode) {
      if (!scope)
        throw new KinaAssertionError(
          "Scope is required to translate user defined type",
        );

      const structName = kinaType.identifier.name;
      const symbol = scope.lookup(structName);
      if (!symbol)
        throw new KinaAssertionError(`Symbol ${structName} not found in scope`);

      const structType = llvm.getStructType(symbol.mangledName);
      if (!structType)
        throw new KinaAssertionError(
          `Struct type ${symbol.mangledName} not found in LLVM registry`,
        );

      return structType;
    }

    if (typeof kinaType === "string" && kinaType.startsWith("udt.")) {
      if (!scope)
        throw new KinaAssertionError(
          "Scope is required to translate user defined type",
        );

      const structName = kinaType.slice(4);
      const symbol = scope.lookup(structName);
      if (!symbol)
        throw new KinaAssertionError(`Symbol ${structName} not found in scope`);

      const structType = llvm.getStructType(symbol.mangledName);
      if (!structType)
        throw new KinaAssertionError(
          `Struct type ${symbol.mangledName} not found in LLVM registry`,
        );

      return structType;
    }

    if (kinaType == TokenKind.TypeVoid) return llvm.builder.getVoidTy();
    if (kinaType == TokenKind.TypeInt) return llvm.builder.getInt32Ty();
    if (kinaType == TokenKind.TypeBool) return llvm.builder.getInt1Ty();
    if (kinaType == TokenKind.TypePtr) return llvm.builder.getPtrTy();
    if (
      kinaType == TokenKind.TypeString ||
      kinaType === "___kina_internal_string"
    ) {
      // First struct prop is pointer to string value, second struct prop is length of string
      const charPtrTy = llvm.builder.getPtrTy();
      const lenTy = llvm.builder.getInt32Ty();

      return llvm.ll.StructType.get(llvm.context, [charPtrTy, lenTy]);
    }

    throw new KinaAssertionError(`Unsupported Kina type: ${kinaType}`);
  }
}
