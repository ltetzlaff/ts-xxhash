import { UInt, UIntFactory } from "cuint"
import toBuffer from "./to-buffer"

export default abstract class XXHash<T extends UInt> extends UInt {
  protected abstract size: number

  protected abstract primes: {
    P1: T
    P2: T
    P3: T
    P4: T
    P5: T
  }

  protected seed!: T
  protected v1!: T
  protected v2!: T
  protected v3!: T
  protected v4!: T

  protected totalLen!: number
  protected memsize!: number
  protected memory?: Uint8Array | Buffer

  protected get vn() {
    return [this.v1, this.v2, this.v3, this.v4]
  }

  /**
   * @param seed unsigned 32-bit integer
   */
  public constructor(
    protected readonly uintClass: typeof UInt,
    protected readonly uintFactory: UIntFactory<T>,
    seed: T | string | number
  ) {
    super()
    this.reseed(seed)
  }

  protected reseed(seed: T | string | number) {
    this.seed =
      seed instanceof this.uintClass ? seed.clone() : this.uintFactory(seed)
    this.v1 = this.seed
      .clone()
      .add(this.primes.P1)
      .add(this.primes.P2)
    this.v2 = this.seed.clone().add(this.primes.P2)
    this.v3 = this.seed.clone()
    this.v4 = this.seed.clone().subtract(this.primes.P1)
    this.totalLen = 0
    this.memsize = 0
    this.memory = undefined
  }

  protected abstract shiftUpdate(v: T, m: Uint8Array | Buffer, p: number): void

  /**
   * Add data to be computed for the hash
   */
  public update(v: string | ArrayBuffer | Buffer) {
    const input = toBuffer(v)
    const len = input.length
    if (len === 0) return this

    this.totalLen += len

    const memory =
      this.memsize === 0
        ? input instanceof Buffer
          ? new Buffer(this.size)
          : new Uint8Array(this.size)
        : this.memory!

    if (this.memsize + len < this.size) {
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
    const inc = this.size / 8

    if (this.memsize > 0) {
      // some data left from previous update
      // XXH64_memcpy(memory + this.memsize, input, 16-this.memsize);
      if (input instanceof Buffer) {
        input.copy(memory, this.memsize, 0, this.size - this.memsize)
      } else {
        memory.set(input.subarray(0, this.size - this.memsize), this.memsize)
      }

      let i = 0
      for (const v of this.vn) {
        this.shiftUpdate(v, memory, i)
        i += inc
      }

      p += this.size - this.memsize
      this.memsize = 0
    }

    if (p <= bEnd - this.size) {
      const limit = bEnd - this.size
      do {
        for (const v of this.vn) {
          this.shiftUpdate(v, input, p)
          p += inc
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
   * Finalize the hash computation. The hash instance is ready for reuse for the given seed
   */
  public abstract digest(): T
}
