import { UINT64, UInt64 } from "cuint"
import XXHash from "./xxhash"

export default class XXHash64 extends XXHash<UInt64> {
  public constructor(seed: UInt64 | string | number) {
    super(UInt64, UINT64, seed)
  }

  public static hash(seed: UInt64 | string | number): XXHash64
  public static hash(
    seed: UInt64 | string | number,
    input: string | ArrayBuffer | Buffer
  ): UInt64
  public static hash(
    seed: UInt64 | string | number,
    input?: string | ArrayBuffer | Buffer
  ) {
    const instance = new this(seed)
    if (input === undefined) return instance

    return instance.update(input).digest()
  }

  protected size = 32

  protected primes = {
    P1: this.uintFactory("11400714785074694791"),
    P2: this.uintFactory("14029467366897019727"),
    P3: this.uintFactory("1609587929392839161"),
    P4: this.uintFactory("9650029242287828579"),
    P5: this.uintFactory("2870177450012600261")
  }

  private shiftDigest(h: UInt64, v: UInt64) {
    h.xor(
      v
        .multiply(this.primes.P2)
        .rotl(31)
        .multiply(this.primes.P1)
    )
    h.multiply(this.primes.P1).add(this.primes.P4)
  }

  protected shiftUpdate(v: UInt64, m: Uint8Array | Buffer, p: number) {
    v.add(
      UINT64(
        (m[p + 1] << 8) | m[p],
        (m[p + 3] << 8) | m[p + 2],
        (m[p + 5] << 8) | m[p + 4],
        (m[p + 7] << 8) | m[p + 6]
      ).multiply(this.primes.P2)
    )
      .rotl(31)
      .multiply(this.primes.P1)
  }

  public digest(): UInt64 {
    const m = this.memory!
    const { P1, P2, P3, P4, P5 } = this.primes
    const h =
      this.totalLen >= this.size
        ? this.v1
            .clone()
            .rotl(1)
            .add(this.v2.clone().rotl(7))
            .add(this.v3.clone().rotl(12))
            .add(this.v4.clone().rotl(18))
        : this.seed.clone().add(P5)

    if (this.totalLen >= this.size) {
      for (const v of this.vn) {
        this.shiftDigest(h, v)
      }
    }

    const u = new UInt64()
    h.add(u.fromNumber(this.totalLen))

    let i = 0
    const inc = this.size / 8
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

    // Reset the state
    this.reseed(this.seed)

    return h
  }
}
