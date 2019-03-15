import { UINT64, UInt64 } from "cuint"
import toUTF8Array from "./to-utf8-array"

const PRIMES = {
  P1: UINT64("11400714785074694791"),
  P2: UINT64("14029467366897019727"),
  P3: UINT64("1609587929392839161"),
  P4: UINT64("9650029242287828579"),
  P5: UINT64("2870177450012600261")
}

const SIZE = 32

type Input = string | ArrayBuffer | Buffer | Uint8Array
type Seed = UInt64 | string | number

const shiftUpdate = (v: UInt64, m: Uint8Array | Buffer, p: number) =>
  v
    .add(
      UINT64(
        (m[p + 1] << 8) | m[p],
        (m[p + 3] << 8) | m[p + 2],
        (m[p + 5] << 8) | m[p + 4],
        (m[p + 7] << 8) | m[p + 6]
      ).multiply(PRIMES.P2)
    )
    .rotl(31)
    .multiply(PRIMES.P1)

const shiftDigest = (h: UInt64, v: UInt64) => {
  h.xor(
    v
      .multiply(PRIMES.P2)
      .rotl(31)
      .multiply(PRIMES.P1)
  )
  h.multiply(PRIMES.P1).add(PRIMES.P4)
}

export default class XXH64 extends UInt64 {
  private seed!: UInt64
  private v1!: UInt64
  private v2!: UInt64
  private v3!: UInt64
  private v4!: UInt64
  private totalLen!: number
  private memsize!: number
  private memory?: Uint8Array | Buffer

  private get vn() {
    return [this.v1, this.v2, this.v3, this.v4]
  }

  /**
   * @param seed unsigned 32-bit integer
   */
  public constructor(seed: Seed) {
    super()
    this.reseed(seed)
  }

  private reseed(seed: Seed) {
    this.seed = seed instanceof UInt64 ? seed.clone() : UINT64(seed)
    this.v1 = this.seed
      .clone()
      .add(PRIMES.P1)
      .add(PRIMES.P2)
    this.v2 = this.seed.clone().add(PRIMES.P2)
    this.v3 = this.seed.clone()
    this.v4 = this.seed.clone().subtract(PRIMES.P1)
    this.totalLen = 0
    this.memsize = 0
    this.memory = undefined
  }

  private static getUTF8(input: Input): Uint8Array | Buffer {
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input)
    } else if (typeof input === "string") {
      return toUTF8Array(input)
    }
    return input
  }

  /**
   * Add data to be computed for the XXH64 hash
   */
  public update(v: string | ArrayBuffer | Buffer): XXH64 {
    const input = XXH64.getUTF8(v)
    const len = input.length
    if (len === 0) return this

    this.totalLen += len

    const memory =
      this.memsize === 0
        ? input instanceof Buffer
          ? new Buffer(SIZE)
          : new Uint8Array(SIZE)
        : this.memory!

    if (this.memsize + len < SIZE) {
      // fill in tmp buffer
      // XXH64_memcpy(memory + this.memsize, input, len)
      if (input instanceof Buffer) {
        input.copy(memory, this.memsize, 0, len)
      } else {
        memory.set(input.subarray(0, len), this.memsize)
      }

      this.memsize += len
      return this
    }

    let p = 0
    const bEnd = p + len

    if (this.memsize > 0) {
      // some data left from previous update
      // XXH64_memcpy(memory + this.memsize, input, 16-this.memsize);
      if (input instanceof Buffer) {
        input.copy(memory, this.memsize, 0, SIZE - this.memsize)
      } else {
        memory.set(input.subarray(0, SIZE - this.memsize), this.memsize)
      }

      let p64 = 0
      for (const v of this.vn) {
        shiftUpdate(v, memory, p64)
        p64 += 8
      }

      p += SIZE - this.memsize
      this.memsize = 0
    }

    if (p <= bEnd - SIZE) {
      const limit = bEnd - SIZE
      do {
        for (const v of this.vn) {
          shiftUpdate(v, input, p)
          p += 8
        }
      } while (p <= limit)
    }

    if (p < bEnd) {
      // XXH64_memcpy(memory, p, bEnd-p);
      if (input instanceof Buffer) {
        input.copy(memory, this.memsize, p, bEnd)
      } else {
        memory.set(input.subarray(p, bEnd), this.memsize)
      }

      this.memsize = bEnd - p
    }

    this.memory = memory
    return this
  }

  /**
   * Finalize the XXH64 computation. The XXH64 instance is ready for reuse for the given seed
   */
  public digest(): UInt64 {
    const m = this.memory!
    const h64 =
      this.totalLen >= SIZE
        ? this.v1.clone().rotl(1)
        : this.seed.clone().add(PRIMES.P5)

    if (this.totalLen >= SIZE) {
      h64.add(this.v2.clone().rotl(7))
      h64.add(this.v3.clone().rotl(12))
      h64.add(this.v4.clone().rotl(18))

      for (const v of this.vn) {
        shiftDigest(h64, v)
      }
    }

    const u = new UInt64()
    h64.add(u.fromNumber(this.totalLen))

    let p = 0
    while (p <= this.memsize - 8) {
      u.fromBits(
        (m[p + 1] << 8) | m[p],
        (m[p + 3] << 8) | m[p + 2],
        (m[p + 5] << 8) | m[p + 4],
        (m[p + 7] << 8) | m[p + 6]
      )
      u.multiply(PRIMES.P2)
        .rotl(31)
        .multiply(PRIMES.P1)
      h64
        .xor(u)
        .rotl(27)
        .multiply(PRIMES.P1)
        .add(PRIMES.P4)
      p += 8
    }

    if (p + 4 <= this.memsize) {
      u.fromBits((m[p + 1] << 8) | m[p], (m[p + 3] << 8) | m[p + 2], 0, 0)
      h64
        .xor(u.multiply(PRIMES.P1))
        .rotl(23)
        .multiply(PRIMES.P2)
        .add(PRIMES.P3)
      p += 4
    }

    while (p < this.memsize) {
      u.fromBits(m[p++], 0, 0, 0)
      h64
        .xor(u.multiply(PRIMES.P5))
        .rotl(11)
        .multiply(PRIMES.P1)
    }

    h64.xor(h64.clone().shiftRight(33)).multiply(PRIMES.P2)
    h64.xor(h64.clone().shiftRight(29)).multiply(PRIMES.P3)
    h64.xor(h64.clone().shiftRight(32))

    // Reset the state
    this.reseed(this.seed)

    return h64
  }
}
