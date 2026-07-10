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
import type { StructSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/StructSymbol";

export class LLVMTypeTranslator {
  public static readonly llvmTypeIntegerWidths = [32];

  constructor() {}

  public static findStructSymbolByMangledName(
    scope: Scope,
    mangledName: string,
  ): StructSymbol | null {
    for (const symbol of scope.getAll()) {
      if (symbol.mangledName === mangledName) return symbol as StructSymbol;
    }

    if (scope.parent)
      return this.findStructSymbolByMangledName(scope.parent, mangledName);

    return null;
  }

  public static getStructType(
    llvm: LLVM,
    kinaType: KinaType | TypeBaseNode,
    scope: Scope,
  ): llvm.StructType {
    let structName = "";
    if (kinaType instanceof UserDefinedTypeNode)
      structName = kinaType.identifier.name;
    else if (typeof kinaType === "string" && kinaType.startsWith("udt."))
      structName = kinaType.slice(4);
    else throw new KinaAssertionError(`Invalid struct type: ${kinaType}`);

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

  static kinaToLLVM(
    llvm: LLVM,
    kinaType: KinaType | TypeBaseNode,
    scope?: Scope,
  ): llvm.Type {
    if (kinaType instanceof PrimitiveTypeNode)
      kinaType = kinaType.primitiveKind;

    const isUDT =
      kinaType instanceof UserDefinedTypeNode ||
      (typeof kinaType === "string" && kinaType.startsWith("udt."));

    if (isUDT) {
      if (!scope)
        throw new KinaAssertionError(
          "Scope is required to translate user defined type",
        );

      this.getStructType(llvm, kinaType, scope); // Validate that the struct exists
      return llvm.builder.getPtrTy();
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
