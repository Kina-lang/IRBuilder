declare const type: unique symbol;

export type LLVMType = string & {
  readonly [type]: true;
};
