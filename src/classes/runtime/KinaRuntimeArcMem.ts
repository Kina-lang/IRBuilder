import type llvm from "@designliquido/llvm-bindings";
import type { LLVM } from "../LLVM";
import { KinaAssertionError } from "@kina-lang/utils";
import { SymbolKind } from "@kina-lang/semantic-analyzer/src/types/symbol";
import { TokenKind } from "@kina-lang/lexer";
import type { Scope } from "@kina-lang/semantic-analyzer";
import type { VariableSymbol } from "@kina-lang/semantic-analyzer/src/classes/symbols/VariableSymbol";
import { LLVMTypeTranslator } from "../LLVMTypeTranslator";

export class KinaRuntimeArcMem {
  private static _functions: Map<string, llvm.Function> = new Map<
    string,
    llvm.Function
  >([]);

  public static init(llvm: LLVM) {
    const funcDefinitions = [
      {
        name: "kina_mem_alloc",
        returnType: llvm.builder.getPtrTy(),
        paramTypes: [llvm.builder.getInt64Ty()],
      },
      {
        name: "kina_mem_retain",
        returnType: llvm.builder.getVoidTy(),
        paramTypes: [llvm.builder.getPtrTy()],
      },
      {
        name: "kina_mem_release",
        returnType: llvm.builder.getVoidTy(),
        paramTypes: [llvm.builder.getPtrTy()],
      },
    ];

    for (const funcDef of funcDefinitions) {
      const funcType = llvm.ll.FunctionType.get(
        funcDef.returnType,
        funcDef.paramTypes,
        false,
      );

      const fun = llvm.ll.Function.Create(
        funcType,
        llvm.ll.Function.LinkageTypes.ExternalLinkage,
        funcDef.name,
        llvm.module,
      );

      this._functions.set(funcDef.name, fun);
    }
  }

  public static alloc(llvm: LLVM, size: llvm.Value): llvm.Value {
    const func = this._functions.get("kina_mem_alloc");
    if (!func)
      throw new KinaAssertionError("Function kina_mem_alloc not found!");

    return llvm.builder.CreateCall(func, [size]);
  }

  public static retain(llvm: LLVM, ptr: llvm.Value) {
    const func = this._functions.get("kina_mem_retain");
    if (!func)
      throw new KinaAssertionError("Function kina_mem_retain not found!");

    llvm.builder.CreateCall(func, [ptr]);
  }

  public static release(llvm: LLVM, ptr: llvm.Value) {
    const func = this._functions.get("kina_mem_release");
    if (!func)
      throw new KinaAssertionError("Function kina_mem_release not found!");

    llvm.builder.CreateCall(func, [ptr]);
  }

  public static releaseScopeVariables(llvm: LLVM, scope: Scope) {
    const insertBlock = llvm.builder.GetInsertBlock();

    // Current block has terminator, we cannot append
    if (insertBlock && insertBlock.getTerminator()) return;

    for (const symbol of scope.getAll()) {
      if (symbol.kind !== SymbolKind.Variable) continue;

      const varSymbol = symbol as VariableSymbol;
      const isString = varSymbol.type === TokenKind.TypeString;
      const isUDT = typeof varSymbol.type === "string" && varSymbol.type.startsWith("udt.");

      if (!isString && !isUDT) continue;

      const alloca = llvm.lookupSymbol(varSymbol);
      if (!alloca) continue;

      if (isString) {
        const llvmType = LLVMTypeTranslator.kinaToLLVM(
          llvm,
          TokenKind.TypeString,
        );
        const oldValue = llvm.builder.CreateLoad(llvmType, alloca);
        const oldCharPtr = llvm.builder.CreateExtractValue(oldValue, [0]);

        this.release(llvm, oldCharPtr);
      } else if (isUDT) {
        const llvmType = llvm.builder.getPtrTy();
        const oldValue = llvm.builder.CreateLoad(llvmType, alloca);

        this.release(llvm, oldValue);
      }
    }
  }

  public static releaseAllActiveScopes(llvm: LLVM, startScope: Scope) {
    let current: Scope | null = startScope;

    while (current) {
      this.releaseScopeVariables(llvm, current);

      current = current.parent;
    }
  }
}
