import { equal } from "assert"
import { describe, it } from "mocha"
import { XXHash32, XXHash64 } from "../src"

describe("XXH", () => {
  const seed = 0

  describe("with small input multiple of 4", () => {
    const input = "abcd"
    const expected = "A3643705" // Computed with xxHash C version

    it("should return hash in a single step", done => {
      const h = XXHash32.hash(seed, input)
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash in many steps", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input)
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })

  describe("with medium input multiple of 4", () => {
    const input = Array(1001).join("abcd")
    const expected = "E18CBEA"

    it("should return hash in a single step", done => {
      const h = XXHash32.hash(seed, input)
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash in many steps", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input)
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })

  describe("with small input", () => {
    const input = "abc"
    const expected = "32D153FF" // Computed with xxHash C version

    it("should return hash in a single step", done => {
      const h = XXHash32.hash(seed, input)
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash in many steps", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input)
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })

  describe("with medium input", () => {
    const input = Array(1000).join("abc")
    const expected = "89DA9B6E"

    it("should return hash in a single step", done => {
      const h = XXHash32.hash(seed, input)
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash in many steps", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input)
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })

  describe("with split medium input", () => {
    const input = Array(1000).join("abc")
    const expected = "89DA9B6E"

    it("should return hash with split input < 16", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input.slice(0, 10))
        .update(input.slice(10))
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash with split input = 16", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input.slice(0, 16))
        .update(input.slice(16))
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash with split input > 16", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input.slice(0, 20))
        .update(input.slice(20))
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })

  describe("with utf-8 strings", () => {
    const input = "heiå"
    const expected = "DB5ABCCC" // Computed with xxHash C version

    it("should return hash", done => {
      const h = XXHash32.hash(seed, input)
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash in many steps", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input)
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })

  describe("with utf-8 strings", () => {
    const input = "κόσμε"
    const expected = "D855F606" // Computed with xxHash C version

    it("should return hash", done => {
      const h = XXHash32.hash(seed, input)
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })

    it("should return hash in many steps", done => {
      const hash = XXHash32.hash(seed)
      const h = hash
        .update(input)
        .digest()
        .toString(16)
        .toUpperCase()

      equal(h, expected)
      done()
    })
  })
})
