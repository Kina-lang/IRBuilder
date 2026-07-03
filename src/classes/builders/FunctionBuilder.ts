import type { FunctionNode, FunctionParameterNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../llvm/LLVMBuilder";
import { BaseBuilder } from "./_base";
import { KinaAssertionError } from "@kina-lang/utils";
import type { FunctionSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/FunctionSymbol";
import { LLVMParameter } from "../llvm/helpers/LLVMParameter";
import { Builders } from "./_index";

export class FunctionBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: FunctionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentModule;
    if (!parent)
      throw new KinaAssertionError(
        "Function definition must be created in a module",
      );

    const { name, parameters, returnType } = node;
    const symbol = rootScope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol not found for function: ${name}`);

    const def = parent.createDefinition(
      parent.ctx.llvmGlobalName(symbol.mangledName),
      parameters.map((p) =>
        this.buildParameter(p, (symbol as FunctionSymbol).scope, builder),
      ),
      parent.ctx.kinaToLlvmType(returnType),
    );

    def.createPrefixComment(
      `FunctionID = "${symbol.name}", MangledID = "${symbol.mangledName}"`,
    );

    builder.setCurrentDefinition(def);

    Builders.BasicBlock.process(
      node.body,
      (symbol as FunctionSymbol).scope,
      builder,
    );

    builder.setCurrentDefinition(null);
    builder.setCurrentBasicBlock(null);
  }

  public buildParameter(
    node: FunctionParameterNode,
    scope: Scope,
    builder: LLVMBuilder,
  ): LLVMParameter {
    const { name, type } = node;
    const symbol = scope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(
        `Symbol not found for function parameter: ${name}`,
      );

    return new LLVMParameter(
      builder,
      builder.ctx.llvmLocalName(symbol.mangledName),
      builder.ctx.kinaToLlvmType(type),
    );
  }
}
