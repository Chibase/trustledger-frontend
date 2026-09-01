import { TextDecoder, TextEncoder } from "node:util";
import { webcrypto } from "node:crypto";
import "@testing-library/jest-dom";

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
});

Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: webcrypto,
});
