import type { ExternNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import { BaseBuilder } from "./_base";
import type { LLVMModule } from "../llvm/instructions/LLVMModule";
import { KinaAssertionError } from "@kina-lang/utils";

export class ExternBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: ExternNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    module: LLVMModule,
  ): void {
    const { name, parameterTypes, returnType } = node;
    const symbol = rootScope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol not found for extern: ${name}`);

    module.createDeclaration(
      module.ctx.llvmGlobalName(symbol.mangledName),
      parameterTypes.map((type) => module.ctx.kinaToLlvmType(type)),
      module.ctx.kinaToLlvmType(returnType),
    );
  }
}
