// Regression check for VCDIFF patches that use xdelta3's LZMA secondary
// compressor (secondary decompressor id 2, the default for xdelta3 builds
// with liblzma). It loads the vendored rom-patcher-js modules exactly like the
// browser does (classic scripts exposing globals), applies a two-window
// fixture patch and verifies the decoded target.
//
// The fixture was generated with Python's liblzma binding:
//   patch = b"\xd6\xc3\xc4\x00" + bytes([0x01, 0x02]) + window1 + window2
// where every secondary section is
//   vli(len(uncompressed)) + lzma.compress(data, format=lzma.FORMAT_XZ, check)
// with 7-bit big-endian varints, CHECK_NONE for window 1 and CHECK_CRC64 for
// window 2 and the window delta indicators 0x03 (data+instructions) and 0x07
// (data+instructions+addresses). Window 1 is one ADD of 16384 bytes; window 2
// is ADD 100 + COPY(size 100, mode 0, address 0), so its target is the first
// 100 bytes repeated twice.
//
// Run with:  npm run check:vcdiff
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.join(here, "public", "rom-patcher-js", "modules");

function loadClassicScript(file) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

loadClassicScript(path.join(modulesDir, "BinFile.js"));
loadClassicScript(path.join(modulesDir, "RomPatcher.secondary.lzma.js"));
loadClassicScript(path.join(modulesDir, "RomPatcher.format.vcdiff.js"));

const BinFile = globalThis.BinFile;
const VCDIFF = globalThis.VCDIFF;
const VCDIFF_LZMA_Stream = globalThis.VCDIFF_LZMA_Stream;

const FIXTURE =
  "1sPEAAECAINygYAAA4MzNQCBgAD9N3pYWgAAAP8S2UECACEBFgAAAHQv5aPgP/8Bdl0AUqjUi2ICIzR35C7Mywv4g/YxHBidiYvS1V5vOy97jh7JbqwkjlklHG92TWdrIMsZBKhPwXv6PkBBuYsJXWUNEto4bIPwTx4WaytoGYYcw7Z8pErN/eTRg+6o6+vPW7bKblyG8wtrRDAtLxs6zkQx2EvrfYpm49vXbK1ST6gC8c2nIUQ7t+C0T4B6qVDt/v0hFoafkpGPwxJsVEvUtCkCe8KtrRPdw83CLNwv93d7DfhsbAM3/Dc10J3MJH2u3yX7GgLWp56Cs1mkLMaDY1AoNAu3QuderRz1Kn3Qru3rVX24JeAAEjfliH0AMXsQMMrp7NtLmqOM2QRFnyR03KCvRUaZkDq8OQcvgwZKIODRtns5c03ihu1oZihxcpYEzq3Jr2yiYBRYxdqQKYmL8vhZAjt4i7FtffuVA1LBP8Pdi69EN5hxal0puRqBrme88ZxyV0Ubgv3ijQ380rPrTnDow5/CoPaLBwTbqTKbWzY7A8mjdvP7IAAAAAAAAYoDgIABAEkFqS6oAAr8AgAAAAAAWVoE/Td6WFoAAAD/EtlBAgAhARYAAAB0L+WjAQADAYGAAAAAARQEZ6ZFCQZynnoBAAAAAABZWgCCIIFIB4EdPT1k/Td6WFoAAATm1rRGAgAhARYAAAB0L+WjAQBjuHmYhxe5/GUTc9NjJIKCXMQJCj3MLVzDF3lAeg7vLXA23Wa6rRjyCKUHghVgRys+CFd5G/+3qqWqWUm16uGsY6vh1R5Bd06/eBQTwjb5mK4owPUjdn8XXRyuq8O+bg1F2APnVgA9L53wbM9KcgABfGSQJtPpH7bzfQEAAAAABFlaBP03elhaAAAE5ta0RgIAIQEWAAAAdC/lowEAAwFkE2QAcb5iR2ydAGUAARwEbyycwR+2830BAAAAAARZWgH9N3pYWgAABObWtEYCACEBFgAAAHQv5aMBAAAAAAAAAFk/Z2Rzoa0fAAEZAaUsgcwftvN9AQAAAAAEWVo=";

const PRNG_SEED = 0x12345678;

function prngBytes(length) {
  const out = new Uint8Array(length);
  let x = PRNG_SEED >>> 0;
  for (let i = 0; i < length; i++) {
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    out[i] = x & 0xff;
  }
  return out;
}

// Mirrors the Python generator used for the fixture: a 300-byte pseudo-random
// block repeated with 0x55 runs and sub-block repeats, so the LZMA2 stream
// exercises literals, rep matches and distances both below and above 128
// (the distance >= 128 path uses direct bits plus the align bittree).
function makeTarget() {
  const block = prngBytes(300);
  const chunk = new Uint8Array(440);
  chunk.set(block, 0); // 300-byte pseudo-random block
  chunk.fill(0x55, 300, 340); // 40-byte run
  chunk.set(block.subarray(90, 190), 340); // overlapping sub-block repeat
  const out = new Uint8Array(16384);
  for (let pos = 0; pos < out.length; pos += chunk.length) {
    out.set(chunk.subarray(0, Math.min(chunk.length, out.length - pos)), pos);
  }
  return out;
}

function toBytes(base64) {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function readVli(bytes, offset) {
  let value = 0;
  for (;;) {
    const byte = bytes[offset++];
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, offset };
  }
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const failures = [];
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures.push(name);
}


function firstDiff(actual, expectedBytes) {
  const limit = Math.min(actual.length, expectedBytes.length);
  for (let i = 0; i < limit; i++) {
    if (actual[i] !== expectedBytes[i]) return `first difference at offset ${i}`;
  }
  if (actual.length !== expectedBytes.length) {
    return `length ${actual.length} vs ${expectedBytes.length}`;
  }
  return "";
}

// Locates window 1's data section (7-bit uncompressed size + xz bytes).
function window1DataSection() {
  const bytes = toBytes(FIXTURE);
  let p = 4; // VCDIFF magic
  const headerIndicator = bytes[p++];
  if (headerIndicator & 0x01) p++; // secondary decompressor id
  if (headerIndicator & 0x02) p = readVli(bytes, p).offset; // code table length
  if (headerIndicator & 0x04) { const v = readVli(bytes, p); p = v.offset + v.value; }
  p++; // window indicator
  p = readVli(bytes, p).offset; // delta encoding length
  p = readVli(bytes, p).offset; // target window length
  p++; // delta indicator
  const dataLength = readVli(bytes, p);
  p = dataLength.offset;
  p = readVli(bytes, p).offset; // instructions length
  p = readVli(bytes, p).offset; // addresses length
  const uncompressedSize = readVli(bytes, p);
  const end = dataLength.offset + dataLength.value;
  return { compressed: bytes.subarray(uncompressedSize.offset, end), outSize: uncompressedSize.value };
}

const target1 = makeTarget();
const data2 = target1.subarray(500, 600);
const expected = new Uint8Array(target1.length + 200);
expected.set(target1, 0);
expected.set(data2, target1.length);
expected.set(data2, target1.length + 100);

// 1) full apply through the VCDIFF module (two windows, one persistent
//    decoder stream per section type, ADD/COPY, data+instructions+addresses)
const applied = new VCDIFF(new BinFile(toBytes(FIXTURE))).apply(
  new BinFile(new Uint8Array(0)),
  false
);
check(
  "apply() returns the declared target size",
  applied.fileSize === expected.length,
  `${applied.fileSize} vs ${expected.length}`
);
check(
  "apply() decodes both windows",
  bytesEqual(applied._u8array, expected),
  firstDiff(applied._u8array, expected)
);

// 2) a single feed decodes a whole section
const section = window1DataSection();
const oneFeed = new VCDIFF_LZMA_Stream().feed(section.compressed, section.outSize);
check(
  "single feed decodes window 1's data section",
  bytesEqual(oneFeed, target1),
  firstDiff(oneFeed, target1)
);

// 3) the decoder is resumable: small input slices and small output budgets
//    must produce the very same bytes (xdelta3 feeds whole sections, but its
//    decoder is resumable; ours must not depend on the slicing)
const stream = new VCDIFF_LZMA_Stream();
const spliced = new Uint8Array(section.outSize);
let inPos = 0;
let outPos = 0;
while (outPos < section.outSize) {
  const remaining = section.outSize - outPos;
  const inTake = Math.min(97, section.compressed.length - inPos);
  const inputSlice = inTake > 0 ? section.compressed.subarray(inPos, inPos + inTake) : new Uint8Array(0);
  const got = stream.feed(inputSlice, Math.min(1000, remaining));
  if (got.length === 0) throw new Error("split feed stalled");
  spliced.set(got, outPos);
  inPos += inTake;
  outPos += got.length;
}
check("split feeds decode the same bytes", bytesEqual(spliced, target1), firstDiff(spliced, target1));

// 4) an over-declared output size must be reported, and reaching that point
//    means the xz block padding, index and footer were parsed successfully
let truncated = "";
try {
  const st = new VCDIFF_LZMA_Stream();
  const probe = st.feed(section.compressed, section.outSize);
  if (probe.length !== section.outSize) throw new Error("short section");
  // No bytes remain for one more; further progress is impossible.
  st.feed(new Uint8Array(0), 1);
} catch (error) {
  truncated = String(error && error.message);
}
check(
  "over-declared output size is reported",
  truncated.indexOf("truncated xz secondary stream") >= 0,
  truncated
);

// 5) every other secondary decompressor still fails loudly
let djwError = "";
try {
  const bytes = toBytes(FIXTURE).slice();
  bytes[5] = 0x01; // secondary decompressor id -> DJW
  new VCDIFF(new BinFile(bytes)).apply(new BinFile(new Uint8Array(0)), false);
} catch (error) {
  djwError = String(error && error.message);
}
check(
  "DJW secondary id (1) still reports not implemented",
  djwError.indexOf("not implemented: secondary decompressor") >= 0,
  djwError
);

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("\nall checks passed");
}
