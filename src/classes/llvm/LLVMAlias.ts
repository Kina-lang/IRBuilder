export class LLVMAlias {
  private readonly _aliasName: string;
  private readonly _targetType: string;
  private readonly _targetUsage: string;

  constructor(aliasName: string, targetType: string, targetUsage: string) {
    this._aliasName = aliasName;
    this._targetType = targetType;
    this._targetUsage = targetUsage;
  }

  public emit(): string {
    return `@${this._aliasName} = alias ${this._targetType}, ${this._targetUsage}`;
  }
}
