import type { IdentifierExpressionNode } from "@kina-lang/ast";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVMBuilder } from "../../llvm/LLVMBuilder";
import { BaseBuilder } from "../_base";
import { KinaAssertionError } from "@kina-lang/utils";
import { SymbolKind } from "@kina-lang/semantic-analyzer/src/types/symbol";
import type { BaseSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/_base";
import type { LLVMModule } from "../../llvm/instructions/LLVMModule";
import type { LLVMDefinition } from "../../llvm/instructions/LLVMDefinition";
import type { LLVMDeclaration } from "../../llvm/instructions/LLVMDeclaration";
import type { LLVMSSARegister } from "../../llvm/instructions/LLVMSSARegister";
import type { LLVMParameter } from "../../llvm/helpers/LLVMParameter";
import type { LLVMBaseExpression } from "../../llvm/expressions/_base";
import { LLVMIdentifier } from "../../llvm/expressions/LLVMIdentifier";

export class IdentifierExpressionBuilder extends BaseBuilder {
  constructor() {
    super();
  }

  override process(
    node: IdentifierExpressionNode,
    rootScope: Scope,
    builder: LLVMBuilder,
  ): LLVMBaseExpression {
    const symbol = rootScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(
        `Symbol not found for identifier: ${node.name}`,
      );

    const parentModule = builder.currentModule;
    if (!parentModule) throw new KinaAssertionError("No current module");

    let resolved:
      | LLVMDefinition
      | LLVMDeclaration
      | LLVMSSARegister
      | LLVMParameter;

    if (
      symbol.kind === SymbolKind.Function ||
      symbol.kind === SymbolKind.Extern
    )
      resolved = this.resolveLlvmCallable(symbol, parentModule);
    else if (
      symbol.kind === SymbolKind.Variable ||
      symbol.kind === SymbolKind.FunctionParameter
    )
      resolved = this.resolveLlvmLocal(symbol, builder);
    else
      throw new KinaAssertionError(
        `Unsupported symbol kind for identifier expression: ${symbol.kind}`,
      );

    return new LLVMIdentifier(builder, resolved);
  }

  private resolveLlvmCallable(
    symbol: BaseSymbol,
    parentModule: LLVMModule,
  ): LLVMDefinition | LLVMDeclaration {
    switch (symbol.kind) {
      case SymbolKind.Function:
        const functionDefinition = parentModule.findDefinition(
          parentModule.ctx.llvmGlobalName(symbol.mangledName),
        );
        if (!functionDefinition)
          throw new KinaAssertionError(
            `Function definition not found for symbol: ${symbol.name}`,
          );

        return functionDefinition;
      case SymbolKind.Extern:
        const externDeclaration = parentModule.findDeclaration(
          parentModule.ctx.llvmGlobalName(symbol.mangledName),
        );
        if (!externDeclaration)
          throw new KinaAssertionError(
            `Extern declaration not found for symbol: ${symbol.name}`,
          );

        return externDeclaration;
      default:
        throw new KinaAssertionError(
          `Cannot resolve LLVM callable for symbol kind: ${symbol.kind}`,
        );
    }
  }

  private resolveLlvmLocal(
    symbol: BaseSymbol,
    builder: LLVMBuilder,
  ): LLVMSSARegister | LLVMParameter {
    const currentDefinition = builder.currentDefinition;
    if (!currentDefinition)
      throw new KinaAssertionError(
        `No current function definition to resolve local: ${symbol.name}`,
      );

    const localName = builder.ctx.llvmLocalName(symbol.mangledName);

    if (symbol.kind === SymbolKind.FunctionParameter) {
      const parameter = currentDefinition.findParameter(localName);
      if (!parameter)
        throw new KinaAssertionError(
          `Function parameter not found: ${symbol.name}`,
        );

      return parameter;
    }

    if (symbol.kind === SymbolKind.Variable) {
      const register = currentDefinition.findRegister(localName);
      if (!register)
        throw new KinaAssertionError(
          `Local variable register not found: ${symbol.name}`,
        );

      return register;
    }

    throw new KinaAssertionError(
      `Unexpected local symbol kind: ${symbol.kind}`,
    );
  }
}
