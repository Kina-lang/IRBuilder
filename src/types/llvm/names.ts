declare const globalName: unique symbol;

export type LLVMGlobalName = `@${string}` & {
  readonly [globalName]: true;
};
