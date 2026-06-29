export function llvmLocalVar(name: string) {
  return `%${name}`;
}

export function llvmGlobalVar(name: string) {
  return `@${name}`;
}
