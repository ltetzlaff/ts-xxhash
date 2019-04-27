# ts-xxhash

xxHash is a very fast hashing algorithm (see the details [here](https://github.com/Cyan4973/xxHash)). xxhashjs is a Javascript implementation of it, written in 100% Javascript. Although not as fast as the C version, it does perform pretty well given the current Javascript limitations in handling unsigned 32 bits integers.

[![Build Status](https://travis-ci.com/ltetzlaff/ts-xxhash.svg?branch=master)](https://travis-ci.com/ltetzlaff/ts-xxhash)

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Usage

- XXH makes 2 functions available for 32 bits XXH and 64 bits XXH respectively, with the same signature:

      	* XXH.h32
      	* XXH.h64

- In one step:
  `XXH.h32(<data>, <seed>)`
  The data can either be a string, an ArrayBuffer or a NodeJS Buffer object.
  The seed can either be a number or a UINT32 object.

- In several steps: \* instantiate a new XXH object H:
  `XXH.h32(<seed>)` or `XXH.h32()`
  The seed can be set later on with the `init` method

      * add data to the hash calculation:

  `H.update(<data>)`

      * finish the calculations:

  `H.digest()`

The object returned can be converted to a string with `toString(<radix>)` or a number `toNumber()`.
Once `digest()` has been called, the object can be reused. The same seed will be used or it can be changed with `init(<seed>)`.

## Methods

- `XXH.h32()`
  _ `.init(<seed>)`
  Initialize the XXH object with the given seed. The seed can either be a number or a UINT32 object.
  _ `.update(<data>)`
  Add data for hashing. The data can either be a string, an ArrayBuffer or a NodeJS Buffer object.

- `digest()` (_UINT32_)
  Finalize the hash calculations and returns an UINT32 object. The hash value can be retrieved with toString(<radix>).

- `XXH.h64()`
  _ `.init(<seed>)`
  Initialize the XXH object with the given seed. The seed can either be a number or a UINT64 object.
  _ `.update(<data>)`
  Add data for hashing. The data can either be a string, an ArrayBuffer or a NodeJS Buffer object. \* `.digest()` (_UINT64_)
  Finalize the hash calculations and returns an UINT64 object. The hash value can be retrieved with toString(<radix>).

## Setup (in ./)

### Install NodeJS

[Download](https://nodejs.org/en/download/current/)

### Fetch dependencies

```bash
npm install
```

## Dev (in ./)

Typescript builds are automatic and watch for file changes:

```bash
npm run build
```

or run this to build only once:

```bash
npm run buildOnce
```

Building, Linting, Formatting, Testing:

```bash
npm test
```

## Contribution

- use `git pull --rebase` in favor of regular pull, i recommend configuring it globally via:
  ```bash
  git config --global pull.rebase true
  ```

## License

MIT
