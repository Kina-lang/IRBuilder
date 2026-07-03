import { BasicBlockBuilder } from "./BasicBlockBuilder";
import { ExternBuilder } from "./ExternBuilder";
import { FunctionBuilder } from "./FunctionBuilder";
import { ReturnStatementBuilder } from "./statement/ReturnStatementBuilder";

export const Builders = {
  Extern: new ExternBuilder(),
  Function: new FunctionBuilder(),
  BasicBlock: new BasicBlockBuilder(),

  Statement: {
    Return: new ReturnStatementBuilder(),
  },
};
