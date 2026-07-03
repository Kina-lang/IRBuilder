import type { FunctionNode, FunctionParameterNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMModule } from "../llvm/instructions/LLVMModule";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import { BaseBuilder } from "./_base";
import { KinaAssertionError } from "@kina-lang/utils";
import type { FunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/FunctionSymbol";
import { LLVMParameter } from "../llvm/helpers/LLVMParameter";

export class FunctionBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: FunctionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
    module: LLVMModule,
  ): void {
    const { name, parameters, returnType } = node;
    const symbol = rootScope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol not found for function: ${name}`);

    // TODO: Add body basic block parsing
    const def = module.createDefinition(
      module.ctx.llvmGlobalName(symbol.mangledName),
      parameters.map((p) =>
        this.buildParameter(
          p,
          (symbol as FunctionSymbol).scope,
          builder,
          module,
        ),
      ),
      module.ctx.kinaToLlvmType(returnType),
    );

    def.createPrefixComment(
      `FunctionID = "${symbol.name}", MangledID = "${symbol.mangledName}"`,
    );
  }

  public buildParameter(
    node: FunctionParameterNode,
    scope: Scope,
    builder: LLVMBuilder,
    module: LLVMModule,
  ): LLVMParameter {
    const { name, type } = node;
    const symbol = scope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(
        `Symbol not found for function parameter: ${name}`,
      );

    return new LLVMParameter(
      builder,
      module.ctx.llvmLocalName(symbol.mangledName),
      module.ctx.kinaToLlvmType(type),
    );
  }
}
