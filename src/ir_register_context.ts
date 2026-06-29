export class KinaIRRegisterContext {
  private current: number = 0;

  constructor() {}

  public nextRegister(): string {
    const reg = this.current.toString(16);

    this.current++;

    return reg;
  }
}
