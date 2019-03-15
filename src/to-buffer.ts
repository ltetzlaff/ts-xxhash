import toUTF8Array from "./to-utf8-array"

export default function(
  input: string | ArrayBuffer | Buffer | Uint8Array
): Uint8Array | Buffer {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  } else if (typeof input === "string") {
    return toUTF8Array(input)
  }
  return input
}
