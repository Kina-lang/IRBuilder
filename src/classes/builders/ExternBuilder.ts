import type { ExternNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import { BaseBuilder } from "./_base";
import { KinaAssertionError } from "@kina-lang/utils";

export class ExternBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: ExternNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentModule;
    if (!parent)
      throw new KinaAssertionError(
        "Extern declaration must be created in a module",
      );

    const { name, parameterTypes, returnType } = node;
    const symbol = rootScope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol not found for extern: ${name}`);

    parent.createDeclaration(
      parent.ctx.llvmGlobalName(symbol.mangledName),
      parameterTypes.map((type) => parent.ctx.kinaToLlvmType(type)),
      parent.ctx.kinaToLlvmType(returnType),
    );
  }
}
