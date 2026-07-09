import { NodeKind, StructNode } from "@kina-lang/ast";
import { BaseVisitor, type IFirstPassVisitor } from "./_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import type { IVisitMeta } from "../../types/meta";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";

export class StructVisitor
  extends BaseVisitor<StructNode>
  implements IFirstPassVisitor<StructNode>
{
  override visit(node: StructNode, currentScope: Scope, llvm: LLVM): boolean {
    if (node.kind !== NodeKind.Struct) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const structType = llvm.getStructType(symbol.mangledName);
    if (!structType)
      throw new KinaAssertionError(`Struct type ${symbol.mangledName} not found in LLVM registry`);

    const fieldTypes = node.fields.map((field) =>
      LLVMTypeTranslator.kinaToLLVM(llvm, field.type, currentScope),
    );

    structType.setBody(fieldTypes);

    return true;
  }

  public firstPass(
    node: StructNode,
    currentScope: Scope,
    llvm: LLVM,
    meta?: Partial<IVisitMeta>,
  ): boolean {
    if (node.kind !== NodeKind.Struct) return false;

    const symbol = currentScope.lookup(node.name);
    if (!symbol)
      throw new KinaAssertionError(`Symbol ${node.name} not found in scope`);

    const type = llvm.ll.StructType.create(
      llvm.context,
      symbol.mangledName,
    );
    llvm.registerStructType(symbol.mangledName, type);

    return true;
  }
}
