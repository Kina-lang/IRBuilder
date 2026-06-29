import type { KinaASTNode } from "@kina-lang/ast/src/nodes/_node";
import {
  EKinaASTNodeKind,
  KinaASTBlockStatementNode,
  KinaASTCallExpressionNode,
  KinaASTExpressionStatementNode,
  KinaASTFunctionDeclarationNode,
  KinaASTLiteralExpressionNode,
  KinaASTParameterDeclarationNode,
  KinaASTReturnStatementNode,
  KinaASTVariableAccessNode,
} from "@kina-lang/ast";
import { LLVMContext } from "./llvm/context";
import { LLVMBuilder } from "./llvm/builder";
import {
  EKinaLexerTokenKind,
  type IKinaLexerTokenKindType,
} from "@kina-lang/lexer";
import type { LLVMBasicBlockInstance } from "./llvm/objects/basic_block";
import type { LLVMStatementObject } from "./types/llvm";
import type { LLVMReturnStatementInstance } from "./llvm/objects/return";
import type { KinaASTExpressionNode } from "@kina-lang/ast/src/nodes/_expression";
import { KinaASTExternDeclarationNode } from "@kina-lang/ast/src/nodes/externDeclaration";
import { randomBytes } from "crypto";
import { llvmGlobalVar, llvmLocalVar } from "./utils/var";
import type { KinaSASymbolTable } from "@kina-lang/semantic-analyzer/src/symbol_table";
import { KinaSAFunctionSymbol } from "@kina-lang/semantic-analyzer/src/symbol/functionSymbol";
import type {
  KinaSAExternSymbol,
  KinaSAVariableSymbol,
} from "@kina-lang/semantic-analyzer";

export class KinaIRBuilder {
  private readonly ast: KinaASTNode[];
  private readonly symbolTable: KinaSASymbolTable;

  private readonly llCtx: LLVMContext;
  private readonly llBuilder: LLVMBuilder;

  constructor(ast: KinaASTNode[], symbolTable: KinaSASymbolTable) {
    this.ast = ast;
    this.symbolTable = symbolTable;

    this.llCtx = new LLVMContext();
    this.llBuilder = new LLVMBuilder(this.llCtx);
  }

  public async build() {
    for (const node of this.ast) {
      await this.processNode(node);
    }

    return this.llBuilder.build();
  }

  private async processNode(node: KinaASTNode) {
    switch (node.kind) {
      case EKinaASTNodeKind.FunctionDeclaration:
        const symbol = this.symbolTable.lookup(
          (node as KinaASTFunctionDeclarationNode).name,
        );
        if (!symbol) throw new Error("Symbol not found in table!");

        this.processFunctionDeclaration(
          node as KinaASTFunctionDeclarationNode,
          symbol as KinaSAFunctionSymbol,
        );
        break;
      case EKinaASTNodeKind.ExternDeclaration:
        this.processExternDeclaration(node as KinaASTExternDeclarationNode);
        break;
      case EKinaASTNodeKind.IncludeDirective:
        // no-op -- is ignored by IR
        break;
      default:
        throw new Error(`Got invalid node type "${node.kind}"`);
    }
  }

  private processFunctionDeclaration(
    node: KinaASTFunctionDeclarationNode,
    symbol: KinaSAFunctionSymbol,
  ) {
    new this.llBuilder.function(
      symbol.getMangledName(),
      this.kinaToLLVMType(node.returnType),
      symbol.parameters.map((p) => ({
        name: p.getMangledName(),
        type: this.kinaToLLVMType(p.type),
      })),
      this.processBlockStatement("entry", node.body, symbol),
    );
  }

  private processExternDeclaration(node: KinaASTExternDeclarationNode) {
    new this.llBuilder.extern(
      node.name,
      node.parameters.map((p) => this.kinaToLLVMType(p)),
      this.kinaToLLVMType(node.returnType),
    );
  }

  private processBlockStatement(
    name: string,
    node: KinaASTBlockStatementNode,
    parentSymbol: KinaSAFunctionSymbol | null,
  ): LLVMBasicBlockInstance {
    return new this.llBuilder.basicBlock(
      name,
      node.statements.map((s) => this.processStatement(s, parentSymbol)),
    );
  }

  private processStatement(
    node: KinaASTNode,
    parentSymbol: KinaSAFunctionSymbol | null,
  ): LLVMStatementObject | string[] {
    switch (node.kind) {
      case EKinaASTNodeKind.ReturnStatement:
        return this.processReturnStatement(
          node as KinaASTReturnStatementNode,
          parentSymbol,
        );
      case EKinaASTNodeKind.ExpressionStatement:
        const exp = this.processExpression(
          (node as KinaASTExpressionStatementNode).expression,
          parentSymbol,
        );

        // We do not care about return type name/value, just the code itself
        return exp.instructions;
      default:
        throw new Error(`Invalid statement type "${node.kind}"`);
    }
  }

  private processReturnStatement(
    node: KinaASTReturnStatementNode,
    parentSymbol: KinaSAFunctionSymbol | null,
  ): LLVMReturnStatementInstance {
    return new this.llBuilder.returnStatement(
      this.processExpression(node.value as KinaASTExpressionNode, parentSymbol),
    );
  }

  private processExpression(
    node: KinaASTExpressionNode,
    parentSymbol: KinaSAFunctionSymbol | null,
  ): {
    name: string;
    type: string;
    instructions: string[];
  } {
    switch (node.kind) {
      case EKinaASTNodeKind.LiteralStatement:
        return this.processExpressionLiteral(
          node as KinaASTLiteralExpressionNode,
        );
      case EKinaASTNodeKind.ExpressionCall:
        return this.processExpressionCall(
          node as KinaASTCallExpressionNode,
          parentSymbol,
        );
      case EKinaASTNodeKind.VariableAccess:
        return this.processVariableAccess(
          node as KinaASTVariableAccessNode,
          parentSymbol,
        );
      default:
        throw new Error(
          `Expression type "${node.kind}" processing is not implemented!`,
        );
    }
  }

  private processExpressionLiteral(node: KinaASTLiteralExpressionNode): {
    name: string;
    type: string;
    instructions: string[];
  } {
    // TODO: Add support for strings
    if (node.resolvedType == EKinaLexerTokenKind.TypeString)
      throw new Error("String are not implemented yet!");

    return {
      name: node.value,
      // TODO: Remove the int32 fallback later!!!
      //       this must be done by semantic analyzer!!
      type: this.kinaToLLVMType(
        node.resolvedType ?? EKinaLexerTokenKind.TypeInt32,
      ),
      instructions: [],
    };
  }

  private processExpressionCall(
    node: KinaASTCallExpressionNode,
    parentSymbol: KinaSAFunctionSymbol | null,
  ): {
    name: string;
    type: string;
    instructions: string[];
  } {
    // Random string
    const varName = "c_" + randomBytes(20).toString("hex");

    if (node.callee.kind != EKinaASTNodeKind.VariableAccess)
      throw new Error("Member access calling is not supported yet!");

    const additionalInstructions: string[] = [];

    const callee = this.resolveFunction(
      node.callee as KinaASTVariableAccessNode,
    );
    const call = new this.llBuilder.call(
      callee.name,
      node.arguments.map((a) => {
        const res = this.processExpression(a, parentSymbol);

        additionalInstructions.push(res.instructions.join("\n"));

        return {
          value: res.name, // TODO: Add compatibility for strings
          type: res.type,
        };
      }),
      this.kinaToLLVMType(callee.returnType),
    );
    const va = new this.llBuilder.varAssignment(varName, call);

    return {
      name: va.fullName,
      type: va.type,
      instructions: [...additionalInstructions, va.stringify()],
    };
  }

  private processVariableAccess(
    node: KinaASTVariableAccessNode,
    parentSymbol: KinaSAFunctionSymbol | null,
  ): {
    name: string;
    type: string;
    instructions: string[];
  } {
    if (!parentSymbol)
      throw new Error("Variable cannot be accessed outside of function scope");

    const localSymbol = parentSymbol.lookup(node.name);
    const globalSymbol = this.symbolTable.lookup(node.name);

    const symbolIsLocal = !!localSymbol;
    const symbol = (localSymbol ?? globalSymbol) as KinaSAVariableSymbol | null;
    if (!symbol) throw new Error(`Variable ${node.name} is not defined!`);

    return {
      name: symbolIsLocal
        ? llvmLocalVar(symbol.getMangledName())
        : llvmGlobalVar(symbol.getMangledName()),
      type: this.kinaToLLVMType(symbol.type),
      instructions: [],
    };
  }

  private resolveFunction(
    node: KinaASTVariableAccessNode,
    parentSymbol: KinaSAFunctionSymbol | null = null,
  ): KinaASTFunctionDeclarationNode | KinaASTExternDeclarationNode {
    const symbol = parentSymbol
      ? parentSymbol.lookup(node.name)
      : this.symbolTable.lookup(node.name);
    if (!symbol) throw new Error(`"${node.name}" is not defined!`);

    // TODO: Add symbol renaming table
    return new KinaASTExternDeclarationNode(
      llvmGlobalVar(
        symbol instanceof KinaSAFunctionSymbol
          ? symbol.getMangledName()
          : (symbol as KinaSAExternSymbol).name,
      ),
      [EKinaLexerTokenKind.TypeInt32],
      EKinaLexerTokenKind.TypeInt32,
    );
  }

  private kinaToLLVMType(type: IKinaLexerTokenKindType): string {
    switch (type) {
      case EKinaLexerTokenKind.TypeInt32:
        return "i32";
      default:
        // TODO: Implement others
        throw new Error(`Type conversion for ${type} is not implemented!`);
    }
  }
}
