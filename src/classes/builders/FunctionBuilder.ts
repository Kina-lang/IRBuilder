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

  public firstPass(
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
  }

  public secondPass(
    node: FunctionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    const parent = builder.currentModule;
    if (!parent)
      throw new KinaAssertionError(
        "Function definition must be created in a module",
      );

    const { name } = node;
    const symbol = rootScope.lookup(name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol not found for function: ${name}`);

    const def = parent.findDefinition(
      parent.ctx.llvmGlobalName(symbol.mangledName),
    );
    if (!def)
      throw new KinaAssertionError(
        `Function definition not found for mangled name: ${symbol.mangledName}`,
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

  override process(
    node: FunctionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): void {
    this.firstPass(node, rootScope, builder);
    this.secondPass(node, rootScope, builder);
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
