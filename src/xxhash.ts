import { Uint, UintConstructor, UINT64 } from "cuint"
import toBuffer from "./to-buffer"

interface IClonable<T> {
  clone(): T
}

function isClonable<T>(obj: {}): obj is IClonable<T> {
  return obj.hasOwnProperty("clone")
}

export default abstract class XXHash<
  C extends UintConstructor<T>,
  T extends Uint = Uint
> extends UINT64 {
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
  protected constructor(protected readonly uintConstructor: C) {
    super(NaN)
  }

  protected getIncrement() {
    return this.size / 4
  }

  protected reseed(seed: IClonable<T> | string | number) {
    this.seed = isClonable(seed)
      ? seed.clone()
      : this.uintConstructor(seed as string)
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

  protected abstract digestCore(m: Uint8Array | Buffer, h: T): T

  /**
   * Finalize the hash computation. The hash instance is ready for reuse for the given seed
   */
  public digest(): T {
    const m = this.memory
    if (m === undefined)
      throw new ReferenceError(
        "Hash Memory not set, .update() has to be called before digest()"
      )
    const { P5 } = this.primes
    const h =
      this.totalLen >= this.size
        ? this.v1
            .rotl(1)
            .add(this.v2.clone().rotl(7))
            .add(this.v3.clone().rotl(12))
            .add(this.v4.clone().rotl(18))
        : this.seed.clone().add(P5)
    const hash = this.digestCore(m, h)

    // Reset the state
    this.reseed(this.seed)

    return hash
  }

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
      this.memory = memory
      return this
    }

    let p = 0
    const bEnd = p + len
    const inc = this.getIncrement()

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
}
