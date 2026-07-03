declare const globalName: unique symbol;
declare const localName: unique symbol;

export type LLVMGlobalName = `@${string}` & {
  readonly [globalName]: true;
};

export type LLVMLocalName = `%${string}` & {
  readonly [localName]: true;
};

export type LLVMName = LLVMGlobalName | LLVMLocalName;
