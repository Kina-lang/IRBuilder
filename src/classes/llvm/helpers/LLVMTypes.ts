import type { LLVMType } from "../../../types/llvm/types";

export class LLVMTypes {
  static int32 = "i32" as LLVMType;
  static bool = "bool" as LLVMType;
  static void = "void" as LLVMType;

  static pointer = "ptr" as LLVMType;

  static func(parameterTypes: LLVMType[], returnType: LLVMType): LLVMType {
    const parameterTypesString = parameterTypes.join(", ");
    return `${returnType} (${parameterTypesString})` as LLVMType;
  }
}
