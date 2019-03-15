declare module "cuint" {
  export type UIntFactory<T extends UInt> = (
    ...numbers: (number | string)[]
  ) => T

  export const UINT64: UIntFactory<UInt64>
  export const UINT32: UIntFactory<UInt32>

  export class UInt {
    protected constructor()

    public clone(): this
    public add(x: this): this
    public subtract(x: this): this
    public multiply(x: this): this
    public xor(x: this): this
    public rotl(n: number): this
    public shiftRight(n: number): this

    public fromNumber(n: number): this
    public fromBits(...bits: number[]): this

    public _low: number
    public _high: number
  }

  export class UInt64 extends UInt {}
  export class UInt32 extends UInt {}
}
