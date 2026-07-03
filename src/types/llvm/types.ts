declare const type: unique symbol;

export type LLVMType = ("i32" | "bool" | "void" | "int32 ()") & {
  readonly [type]: true;
};
