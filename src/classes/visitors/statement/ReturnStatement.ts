import { NodeKind, type ReturnStatementNode } from "@kina-lang/ast";
import { BaseVisitor } from "../_base";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { LLVM } from "../../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { KinaIRBuilder } from "../../KinaIRBuilder";
import { KinaRuntimeArcMem } from "../../runtime/KinaRuntimeArcMem";

export class ReturnStatementVisitor extends BaseVisitor<ReturnStatementNode> {
  override visit(
    node: ReturnStatementNode,
    currentScope: Scope,
    llvm: LLVM,
  ): boolean {
    if (node.kind !== NodeKind.ReturnStatement) return false;

    const currentFunction = llvm.activeFunction;
    if (!currentFunction)
      throw new KinaAssertionError(
        "No active function found for return statement",
      );

    const returnValue = node.value;

    const wantedReturnType = llvm.activeFunction!.getReturnType();

    // If there is no return value, we should return void
    if (!returnValue) {
      if (!wantedReturnType.isVoidTy())
        throw new KinaAssertionError(
          "Return statement has no value, but function expects a return value",
        );

      KinaRuntimeArcMem.releaseAllActiveScopes(llvm, currentScope);
      llvm.flushTemporaryReleaseQueue();

      llvm.builder.CreateRetVoid();
      return true;
    }

    const retValue = KinaIRBuilder.parseExpression(
      returnValue,
      currentScope,
      llvm,
      wantedReturnType,
    );

    // Retain return value if it is a reference-counted type (e.g. String struct)
    if (wantedReturnType.isStructTy()) {
      const charPtr = llvm.builder.CreateExtractValue(retValue, [0]);
      KinaRuntimeArcMem.retain(llvm, charPtr);
    }

    KinaRuntimeArcMem.releaseAllActiveScopes(llvm, currentScope);
    llvm.flushTemporaryReleaseQueue();

    llvm.builder.CreateRet(retValue);

    return true;
  }
}
