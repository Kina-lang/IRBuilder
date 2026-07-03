import { BasicBlockBuilder } from "./BasicBlockBuilder";
import { ExternBuilder } from "./ExternBuilder";
import { FunctionBuilder } from "./FunctionBuilder";

export const Builders = {
  Extern: new ExternBuilder(),
  Function: new FunctionBuilder(),
  BasicBlock: new BasicBlockBuilder(),
};
