import { UINT32, UInt32 } from "cuint"
import XXHash from "./xxhash"

export default class XXHash32 extends XXHash<UInt32> {
  public constructor(seed: UInt32 | string | number) {
    super(UInt32, UINT32, seed)
  }

  protected size = 16

  protected primes = {
    P1: this.uintFactory("2654435761"),
    P2: this.uintFactory("2246822519"),
    P3: this.uintFactory("3266489917"),
    P4: this.uintFactory("668265263"),
    P5: this.uintFactory("374761393")
  }

  /**
   * Merged this sequence of method calls as it speeds up
    the calculations by a factor of 2
  */
  private updateUInt32(uint: UInt32, low: number, high: number) {
    const { P1, P2 } = this.primes
    let b00 = P2._low
    let b16 = P2._high

    let c00 = low * b00
    let c16 = c00 >>> 16

    c16 += high * b00
    c16 &= 0xffff // Not required but improves performance
    c16 += low * b16

    let a00 = uint._low + (c00 & 0xffff)
    let a16 = a00 >>> 16

    a16 += uint._high + (c16 & 0xffff)

    let v = (a16 << 16) | (a00 & 0xffff)
    v = (v << 13) | (v >>> 19)

    a00 = v & 0xffff
    a16 = v >>> 16

    b00 = P1._low
    b16 = P1._high

    c00 = a00 * b00
    c16 = c00 >>> 16

    c16 += a16 * b00
    c16 &= 0xffff // Not required but improves performance
    c16 += a00 * b16

    uint._low = c00 & 0xffff
    uint._high = c16 & 0xffff
  }

  protected shiftUpdate(v: UInt32, m: Uint8Array | Buffer, p: number) {
    this.updateUInt32(v, (m[p + 1] << 8) | m[p], (m[p + 3] << 8) | m[p + 2])
  }

  public digest(): UInt32 {
    const m = this.memory!
    const { P1, P2, P3, P4, P5 } = this.primes
    const h =
      this.totalLen >= this.size
        ? this.v1
            .clone()
            .rotl(1)
            .add(
              this.v2
                .clone()
                .rotl(7)
                .add(
                  this.v3
                    .clone()
                    .rotl(12)
                    .add(this.v4.clone().rotl(18))
                )
            )
        : this.seed.clone().add(P5)

    const u = new this.uintClass()
    h.add(u.fromNumber(this.totalLen))

    let i = 0
    const inc = this.size / 8
    while (i <= this.memsize - inc) {
      u.fromBits((m[i + 1] << 8) | m[i], (m[i + 3] << 8) | m[i + 2])
      h.add(u.multiply(P3))
        .rotl(17)
        .multiply(P4)
      i += inc
    }

    while (i < this.memsize) {
      u.fromBits(m[i++], 0)
      h.add(u.multiply(P5))
        .rotl(11)
        .multiply(P1)
    }

    h.xor(h.clone().shiftRight(15)).multiply(P2)
    h.xor(h.clone().shiftRight(13)).multiply(P3)
    h.xor(h.clone().shiftRight(16))

    // Reset the state
    this.reseed(this.seed)

    return h
  }
}