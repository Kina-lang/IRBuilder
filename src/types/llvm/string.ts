declare const nullTerminatedString: unique symbol;

export type NullTerminatedString = string & {
  readonly [nullTerminatedString]: true;
};
