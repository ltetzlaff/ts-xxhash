import { UINT64, Uint, Uint64Constructor } from "cuint"
import XXHash from "./xxhash"

export default class XXHash64 extends XXHash<Uint64Constructor<Uint>> {
  protected size = 32

  protected primes = {
    P1: this.uintConstructor("11400714785074694791"),
    P2: this.uintConstructor("14029467366897019727"),
    P3: this.uintConstructor("1609587929392839161"),
    P4: this.uintConstructor("9650029242287828579"),
    P5: this.uintConstructor("2870177450012600261")
  }

  public constructor(seed: Uint | string | number) {
    super(UINT64)
    this.reseed(seed)
  }

  public static hash(seed: Uint | string | number): XXHash64
  public static hash(
    seed: Uint | string | number,
    input: string | ArrayBuffer | Buffer
  ): Uint
  public static hash(
    seed: Uint | string | number,
    input?: string | ArrayBuffer | Buffer
  ) {
    const instance = new this(seed)
    if (input === undefined) return instance

    return instance.update(input).digest()
  }

  private shiftDigest(h: Uint, v: Uint) {
    h.xor(
      v
        .multiply(this.primes.P2)
        .rotl(31)
        .multiply(this.primes.P1)
    )
    h.multiply(this.primes.P1).add(this.primes.P4)
  }

  protected shiftUpdate(v: Uint, m: Uint8Array | Buffer, p: number) {
    v.add(
      this.uintConstructor(
        (m[p + 1] << 8) | m[p],
        (m[p + 3] << 8) | m[p + 2],
        (m[p + 5] << 8) | m[p + 4],
        (m[p + 7] << 8) | m[p + 6]
      ).multiply(this.primes.P2)
    )
      .rotl(31)
      .multiply(this.primes.P1)
  }

  protected digestCore(m: Uint8Array | Buffer, h: Uint): Uint {
    const { P1, P2, P3, P4, P5 } = this.primes

    if (this.totalLen >= this.size) {
      for (const v of this.vn) {
        this.shiftDigest(h, v)
      }
    }

    const u = this.uintConstructor(NaN)
    h.add(u.fromNumber(this.totalLen))

    let i = 0
    const inc = this.getIncrement()
    while (i <= this.memsize - inc) {
      u.fromBits(
        (m[i + 1] << 8) | m[i],
        (m[i + 3] << 8) | m[i + 2],
        (m[i + 5] << 8) | m[i + 4],
        (m[i + 7] << 8) | m[i + 6]
      )
      u.multiply(P2)
        .rotl(31)
        .multiply(P1)
      h.xor(u)
        .rotl(27)
        .multiply(P1)
        .add(P4)
      i += inc
    }

    if (i + 4 <= this.memsize) {
      u.fromBits((m[i + 1] << 8) | m[i], (m[i + 3] << 8) | m[i + 2], 0, 0)
      h.xor(u.multiply(P1))
        .rotl(23)
        .multiply(P2)
        .add(P3)
      i += 4
    }

    while (i < this.memsize) {
      u.fromBits(m[i++], 0, 0, 0)
      h.xor(u.multiply(P5))
        .rotl(11)
        .multiply(P1)
    }

    h.xor(h.clone().shiftRight(33)).multiply(P2)
    h.xor(h.clone().shiftRight(29)).multiply(P3)
    h.xor(h.clone().shiftRight(32))

    return h
  }
}
