/* RomPatcher.secondary.lzma.js
 * xz (LZMA2) stream decoder for VCDIFF secondary compression:
 * xdelta3 secondary compressor ID 2 ("LZMA").
 *
 * Why this exists: modern xdelta3 enables LZMA secondary compression by
 * default when built with liblzma (xdelta3-main.h main_set_secondary_flags:
 * "Set a default secondary compressor if LZMA is built in"). Those patches
 * set Hdr_Indicator bit VCD_DECOMPRESS (0x01) plus secondary ID byte 2
 * (xdelta3.c: VCD_LZMA_ID = 2; also VCD_DJW_ID = 1, VCD_FGK_ID = 16), and
 * every secondary-compressed section of every window is an xz/LZMA2 stream
 * slice. The VCDIFF module negotiates the ID and hands each section here.
 *
 * Exact framing mirrored from xdelta3 (Apache-2.0) + xz utils (0BSD):
 *  - Per section (data / instructions / addresses): a 7-bit varint of the
 *    UNCOMPRESSED size, then that many bytes of stream payload
 *    (xdelta3-second.h xd3_decode_secondary / xd3_emit_size).
 *  - One decoder stream PER SECTION TYPE persists across all windows of an
 *    apply pass (xdelta3-second.h xd3_get_secondary initialises a stream
 *    only while it is NULL; streams are destroyed only in
 *    xd3_free_stream), with the encoder issuing LZMA_SYNC_FLUSH at every
 *    window boundary. Each window's slice therefore CONTINUES the previous
 *    window's xz stream; unread tail bytes of one slice logically precede
 *    the next slice.
 *  - Each feed must produce exactly the varint-declared output size;
 *    surplus input is buffered for the next feed (liblzma keeps unread
 *    input internally too; xdelta3 then asserts full input consumption and
 *    exact output size per section).
 *
 * Decoder semantics are a direct port of xz utils 5.8.3
 * (src/liblzma/lzma/lzma2_decoder.c, lzma_decoder.c,
 * rangecoder/range_decoder.h, lz/lz_decoder.h): the LZMA2 control-byte
 * state machine, per-chunk range-coder initialisation (rc_read_init, first
 * byte must be 0x00), chunk-end normalisation followed by the
 * `code == 0` finish check (rc_is_finished), and exact per-chunk
 * compressed-size accounting.
 *
 * Pure JavaScript, no dependencies, synchronous. Classic-script global:
 * VCDIFF_LZMA_Stream. CommonJS export for tests.
 */

/* range_common.h */
var VCDIFF_LZMA_TOP = 0x1000000; /* RC_TOP_VALUE = 1<<24 */
var VCDIFF_LZMA_BITS = 11; /* RC_BIT_MODEL_TOTAL_BITS */
var VCDIFF_LZMA_PROB_TOTAL = 2048; /* RC_BIT_MODEL_TOTAL */
var VCDIFF_LZMA_MOVE = 5; /* RC_MOVE_BITS */
var VCDIFF_LZMA_INIT_PROB = VCDIFF_LZMA_PROB_TOTAL >> 1; /* bit_reset */

/* lzma_common.h */
var VCDIFF_LZMA_STATES = 12;
var VCDIFF_LZMA_POS_STATES_MAX = 16;
var VCDIFF_LZMA_LEN_LOW_SYMBOLS = 8;
var VCDIFF_LZMA_LEN_MID_SYMBOLS = 8;
var VCDIFF_LZMA_LEN_HIGH_SYMBOLS = 256;
var VCDIFF_LZMA_MATCH_LEN_MIN = 2;
var VCDIFF_LZMA_DIST_STATES = 4;
var VCDIFF_LZMA_DIST_SLOTS = 64;
var VCDIFF_LZMA_DIST_MODEL_END = 14;
var VCDIFF_LZMA_ALIGN_BITS = 4;
var VCDIFF_LZMA_ALIGN_SIZE = 16;
/* pos_special[FULL_DISTANCES - DIST_MODEL_END] = 128 - 14 */
var VCDIFF_LZMA_POS_SPECIAL = 114;
var VCDIFF_LZMA_LITERAL_SIZE = 0x300;
var VCDIFF_LZMA_LCLP_MAX = 4;

function VCDIFF_LZMA_fail(msg) {
	throw new Error("VCDIFF LZMA secondary: " + msg);
}

/**
 * One persistent xz/LZMA2 decoder stream. Created fresh per section type
 * per VCDIFF apply pass; `feed(u8, outSize)` is called once per window
 * section slice and must return exactly `outSize` bytes.
 */
function VCDIFF_LZMA_Stream() {
	/* Input: every byte handed to feed() is logically consumed; the
	   unread remainder carries into the next feed (liblzma-style). */
	this.inBuf = new Uint8Array(0);
	this.inPos = 0;

	/* container state */
	this.phase = "stream-header";
	this.hdrChunk = null; /* partial header accumulator */
	this.hdrNeeded = 0;
	this.blockFirstByte = -1;
	this.dictSize = 0;
	this.checkType = 0; /* stream flags: 0 none, 1 CRC32, 4 CRC64, 10 SHA-256 */
	this.checkSize = 0;
	this.blockHeaderSize = 0;
	this.dataLen = 0; /* bytes of the current block's LZMA2 data */

	/* Index state: only reached when output is requested past the end of a
	   complete xz stream. xdelta3 stops at sync-flush boundaries, so real
	   VCDIFF secondary sections never get here. */
	this.idxLen = 0;
	this.idxState = "count";
	this.idxRecords = 0;
	this.idxPadDone = 0;
	this.idxCrcDone = 0;
	this.idxVli = null;

	/* lzma2 chunk machine (lzma2_decoder.c sequences) */
	this.l2 = null;
	/* lzma1 decoder state */
	this.lz = null;
}

/* ---------------------------------------------------------------- input --
 * Pull the next byte; -1 when more input is needed (state not mutated). */
VCDIFF_LZMA_Stream.prototype._needByte = function () {
	if (this.inPos >= this.inBuf.length) return -1;
	return this.inBuf[this.inPos++];
};

/* Accumulate exactly n bytes; null while incomplete, Uint8Array once done. */
VCDIFF_LZMA_Stream.prototype._collect = function (n) {
	if (this.hdrChunk === null || this.hdrChunk.length !== n) {
		this.hdrChunk = new Uint8Array(n);
		this.hdrNeeded = 0;
	}
	while (this.hdrNeeded < n) {
		if (this.inPos >= this.inBuf.length) return null;
		this.hdrChunk[this.hdrNeeded++] = this.inBuf[this.inPos++];
	}
	var out = this.hdrChunk;
	this.hdrChunk = null;
	this.hdrNeeded = 0;
	return out;
};

/* crc32 (xz CRC32 / zlib polynomial) for header verification. */
var VCDIFF_LZMA_CRC_TABLE = (function () {
	var table = new Uint32Array(256);
	for (var n = 0; n < 256; n++) {
		var c = n;
		for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();
function VCDIFF_LZMA_crc32(u8, start, end) {
	var c = 0xffffffff;
	for (var i = start; i < end; i++)
		c = VCDIFF_LZMA_CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/* ------------------------------------------------------------- container -- */

VCDIFF_LZMA_Stream.prototype._phaseStreamHeader = function () {
	var h = this._collect(12);
	if (h === null) return false;
	if (
		h[0] !== 0xfd || h[1] !== 0x37 || h[2] !== 0x7a || h[3] !== 0x58 ||
		h[4] !== 0x5a || h[5] !== 0x00
	) {
		VCDIFF_LZMA_fail("not an xz stream (bad stream header magic)");
	}
	if (h[6] !== 0x00 || (h[7] & 0xf0) !== 0)
		VCDIFF_LZMA_fail("unsupported xz stream flags");
	var flagsCrc = (h[8] | (h[9] << 8) | (h[10] << 16) | (h[11] << 24)) >>> 0;
	if (VCDIFF_LZMA_crc32(h, 6, 8) !== flagsCrc)
		VCDIFF_LZMA_fail("xz stream header CRC mismatch");
	/* Stream Flags: the first byte must be 0x00 and the second holds the
	   Check ID in its lowest four bits (0 none, 1 CRC32, 4 CRC64,
	   10 SHA-256). The Check itself is never verified: xdelta3 secondary
	   sections only need the decoded bytes. */
	if (h[6] !== 0x00 || (h[7] & 0xf0) !== 0)
		VCDIFF_LZMA_fail("unsupported xz stream flags");
	if (h[7] === 0x00) this.checkSize = 0;
	else if (h[7] === 0x01) this.checkSize = 4;
	else if (h[7] === 0x04) this.checkSize = 8;
	else if (h[7] === 0x0a) this.checkSize = 32;
	else VCDIFF_LZMA_fail("unsupported xz check type (" + h[7] + ")");
	this.checkType = h[7];
	this.phase = "block-header";
	return true;
};

VCDIFF_LZMA_Stream.prototype._phaseBlockHeader = function () {
	/* A previously peeked first byte (multi-block streams) seeds hdrChunk. */
	if (this.hdrChunk === null) {
		if (this.blockFirstByte >= 0) {
			var b0 = this.blockFirstByte;
			this.blockFirstByte = -1;
			this.hdrChunk = new Uint8Array((b0 + 1) * 4);
			this.hdrChunk[0] = b0;
			this.hdrNeeded = 1;
		} else {
			var b = this._needByte();
			if (b < 0) return false;
			this.hdrChunk = new Uint8Array((b + 1) * 4);
			this.hdrChunk[0] = b;
			this.hdrNeeded = 1;
		}
	}
	var size = this.hdrChunk.length;
	var h = this._collect(size);
	if (h === null) return false;
	this.blockHeaderSize = size;

	/* CRC32 over the first size-4 bytes */
	var crc = (h[size - 4] | (h[size - 3] << 8) | (h[size - 2] << 16) | (h[size - 1] << 24)) >>> 0;
	if (VCDIFF_LZMA_crc32(h, 0, size - 4) !== crc)
		VCDIFF_LZMA_fail("xz block header CRC mismatch");

	var flags = h[1];
	var numFilters = (flags & 0x03) + 1;
	if ((flags & 0xf8) !== 0) VCDIFF_LZMA_fail("unsupported xz block header flags");
	if (numFilters !== 1) VCDIFF_LZMA_fail("unsupported xz filter chain (only single LZMA2)");

	var pos = 2;
	function readVli() {
		var v = 0, shift = 0, byte;
		for (;;) {
			if (pos >= size - 4) return -1;
			byte = h[pos++];
			v += (byte & 0x7f) * Math.pow(2, shift);
			if ((byte & 0x80) === 0) break;
			shift += 7;
			if (shift > 28) return -1;
		}
		return v;
	}
	var filterId = readVli();
	var propsSize = readVli();
	if (filterId < 0 || propsSize < 0 || pos + propsSize > size - 4)
		VCDIFF_LZMA_fail("truncated xz block header");
	if (filterId !== 0x21) VCDIFF_LZMA_fail("unsupported xz filter (LZMA2 only)");
	if (propsSize !== 1) VCDIFF_LZMA_fail("unsupported xz LZMA2 property size");
	var prop = h[pos++];
	if (prop > 40) VCDIFF_LZMA_fail("invalid xz LZMA2 dictionary property");
	for (; pos < size - 4; pos++)
		if (h[pos] !== 0) VCDIFF_LZMA_fail("non-zero xz block header padding");

	/* (2 | (prop & 1)) << ((prop >> 1) + 11), without the JavaScript
	   32-bit shift overflow a large property byte would cause. */
	this.dictSize = (2 | (prop & 1)) * Math.pow(2, (prop >> 1) + 11);
	if (this.dictSize < 4096 || this.dictSize > 0x40000000)
		VCDIFF_LZMA_fail("unsupported xz dictionary size");

	this.dataLen = 0;
	this._startBlockStreams();
	this.phase = "lzma2";
	return true;
};

/* One LZMA2 + LZMA1 state pair per xz block (xdelta3 encodes single-block
   streams, but multi-block input is handled for completeness). */
VCDIFF_LZMA_Stream.prototype._startBlockStreams = function () {
	this.l2 = {
		seq: "control", /* control | unc1 | unc2 | cs1 | cs2 | props | lzma | copy */
		next: "lzma",
		control: 0,
		needProps: true, /* first LZMA chunk must carry properties */
		needDictReset: true, /* stream must begin with a dictionary reset */
		uncompSize: 0,
		compSize: 0,
		/* dictionary: ring buffer + counters (lz_decoder.h semantics) */
		dict: new Uint8Array(this.dictSize),
		dictPos: 0, /* physical position, cleared on dictionary reset */
		dictFull: 0, /* min(bytes since reset, dictSize) */
		prev: 0 /* previous byte for literal contexts */
	};
	this.lz = {
		seq: "init", /* init | chunk-end | is_match | len* | dist* | copy ... */
		rcInitLeft: 0,
		rcInitPending: false, /* true: chunk starts with rc_read_init bytes */
		range: 0,
		code: 0,
		cUsed: 0, /* compressed bytes consumed in current LZMA chunk */
		cLimit: 0,
		uncLeft: 0, /* uncompressed bytes remaining in current chunk */
		state: 0,
		reps: [0, 0, 0, 0],
		posMask: 0,
		lc: 0,
		lp: 0,
		litMask: 0,
		literal: null,
		isMatch: null,
		isRep: null,
		isRep0: null,
		isRep1: null,
		isRep2: null,
		isRep0Long: null,
		distSlot: null,
		posSpecial: null,
		posAlign: null,
		matchLen: null,
		repLen: null,
		/* resumable symbol decoding */
		sym: null
	};
};

/* --------------------------------------------------------------- output -- */

/* Writes one byte to both the section output and the dictionary ring. */
VCDIFF_LZMA_Stream.prototype._writeOutput = function (out, value) {
	var l2 = this.l2;
	l2.dict[l2.dictPos] = value;
	if (++l2.dictPos >= l2.dict.length) l2.dictPos = 0;
	if (l2.dictFull < l2.dict.length) l2.dictFull++;
	l2.prev = value;
	out.buf[out.pos++] = value;
};

/* Read byte from dictionary at `distance` back (dict_get). */
VCDIFF_LZMA_Stream.prototype._dictGet = function (distance) {
	var l2 = this.l2;
	var idx = l2.dictPos - distance - 1;
	if (idx < 0) idx += l2.dict.length;
	return l2.dict[idx];
};

/* --------------------------------------------------------------- lzma2 --- */

VCDIFF_LZMA_Stream.prototype._lzma2Step = function (out) {
	var l2 = this.l2;
	var lz = this.lz;

	for (;;) {
		switch (l2.seq) {
			case "control": {
				var c = this._hdrByte();
				if (c < 0) return false;
				if (c === 0x00) {
					/* end of this block's LZMA2 stream */
					this.phase = "block-pad";
					return true;
				}
				if (c >= 0xe0 || c === 1) {
					l2.needProps = true;
					l2.needDictReset = true;
				} else if (l2.needDictReset) {
					VCDIFF_LZMA_fail("xz stream must begin with a dictionary reset");
				}
				if (c >= 0x80) {
					/* LZMA chunk */
					l2.uncompSize = (c & 0x1f) << 16;
					l2.seq = "unc1";
					if (c >= 0xc0) {
						l2.needProps = false;
						l2.next = "props";
					} else if (l2.needProps) {
						VCDIFF_LZMA_fail("xz LZMA chunk missing properties byte");
					} else {
						l2.next = "lzma";
						if (c >= 0xa0) this._lzmaFullReset();
					}
				} else {
					if (c > 2) VCDIFF_LZMA_fail("invalid xz LZMA2 control byte");
					/* uncompressed chunk: 2-byte size then raw copy */
					l2.seq = "cs1";
					l2.next = "copy";
				}
				if (l2.needDictReset) {
					/* dictionary reset is committed after the control byte is
					   interpreted (lzma2_decoder.c returns LZMA_OK once here) */
					l2.needDictReset = false;
					l2.dictPos = 0;
					l2.dictFull = 0;
					l2.prev = 0;
					l2.dict.fill(0);
				}
				return true;
			}
			case "unc1": {
				var u1 = this._hdrByte();
				if (u1 < 0) return false;
				l2.uncompSize += u1 << 8;
				l2.seq = "unc2";
				return true;
			}
			case "unc2": {
				var u2 = this._hdrByte();
				if (u2 < 0) return false;
				l2.uncompSize += u2 + 1;
				l2.seq = "cs1";
				return true;
			}
			case "cs1": {
				var s1 = this._hdrByte();
				if (s1 < 0) return false;
				l2.compSize = s1 << 8;
				l2.seq = "cs2";
				return true;
			}
			case "cs2": {
				var s2 = this._hdrByte();
				if (s2 < 0) return false;
				l2.compSize += s2 + 1;
				l2.seq = l2.next;
				if (l2.seq === "lzma") {
					/* begin a fresh range-coded chunk */
					lz.cUsed = 0;
					lz.cLimit = l2.compSize;
					lz.uncLeft = l2.uncompSize;
					lz.seq = "init";
				} else if (l2.seq === "copy") {
					/* Uncompressed chunk: only the compressed size is
					   stored, and the uncompressed size equals it. */
					l2.uncompSize = l2.compSize;
				}
				return true;
			}
			case "props": {
				var p = this._hdrByte();
				if (p < 0) return false;
				if (p >= 9 * 5 * 5) VCDIFF_LZMA_fail("invalid xz LZMA properties byte");
				var lc = p % 9;
				var rem = (p / 9) | 0;
				var lp = rem % 5;
				var pb = (rem / 5) | 0;
				if (lc + lp > VCDIFF_LZMA_LCLP_MAX)
					VCDIFF_LZMA_fail("invalid xz LZMA lc/lp/pb combination");
				lz.lc = lc;
				lz.lp = lp;
				lz.posMask = (1 << pb) - 1;
				lz.litMask = ((0x100 << lp) - (0x100 >> lc)) >>> 0;
				lz.literal = new Uint16Array(VCDIFF_LZMA_LITERAL_SIZE << (lc + lp));
				/* lzma_decoder_reset() with the new properties: state,
				   repeated distances, range decoder and probabilities. */
				this._lzmaFullReset();
				l2.seq = "lzma";
				lz.cUsed = 0;
				lz.cLimit = l2.compSize;
				lz.uncLeft = l2.uncompSize;
				lz.seq = "init";
				return true;
			}
			case "copy": {
				/* raw uncompressed chunk */
				while (l2.compSize > 0) {
					if (out.pos >= out.size) return false; /* output full */
					var b = this._hdrByte();
					if (b < 0) return false;
					this._writeOutput(out, b);
					l2.compSize--;
				}
				l2.seq = "control";
				return true;
			}
			case "lzma": {
				return this._lzmaSymbolStep(out);
			}
		}
		VCDIFF_LZMA_fail("internal: unknown lzma2 sequence");
	}
};

/* Input byte bounded by the current LZMA chunk's compressed size (+1 byte
   tolerated transiently, mirroring lzma2_decode's in_limit = csize + 1). */
VCDIFF_LZMA_Stream.prototype._lzmaBoundByte = function () {
	var lz = this.lz;
	if (this.inPos >= this.inBuf.length) return -1;
	if (lz.cUsed > lz.cLimit) VCDIFF_LZMA_fail("xz LZMA chunk overruns its compressed size");
	lz.cUsed++;
	this.dataLen++;
	return this.inBuf[this.inPos++];
};

/* Pull the next LZMA2 header byte, counting it as Compressed Data. */
VCDIFF_LZMA_Stream.prototype._hdrByte = function () {
	var b = this._needByte();
	if (b >= 0) this.dataLen++;
	return b;
};

/* ------------------------------------------------------- lzma1 reset --- */

VCDIFF_LZMA_Stream.prototype._lzmaFullReset = function () {
	var lz = this.lz;
	lz.state = 0;
	lz.reps[0] = lz.reps[1] = lz.reps[2] = lz.reps[3] = 0;
	/* rc_reset: the next LZMA chunk starts with the five rc_read_init bytes */
	lz.rcInitLeft = 5;
	lz.rcInitPending = true;
	lz.range = 0xffffffff;
	lz.code = 0;
	if (!lz.isMatch) {
		lz.isMatch = new Uint16Array(VCDIFF_LZMA_STATES * VCDIFF_LZMA_POS_STATES_MAX);
		lz.isRep = new Uint16Array(VCDIFF_LZMA_STATES);
		lz.isRep0 = new Uint16Array(VCDIFF_LZMA_STATES);
		lz.isRep1 = new Uint16Array(VCDIFF_LZMA_STATES);
		lz.isRep2 = new Uint16Array(VCDIFF_LZMA_STATES);
		lz.isRep0Long = new Uint16Array(VCDIFF_LZMA_STATES * VCDIFF_LZMA_POS_STATES_MAX);
		lz.distSlot = new Uint16Array(VCDIFF_LZMA_DIST_STATES * VCDIFF_LZMA_DIST_SLOTS);
		lz.posSpecial = new Uint16Array(VCDIFF_LZMA_POS_SPECIAL);
		lz.posAlign = new Uint16Array(VCDIFF_LZMA_ALIGN_SIZE);
		lz.matchLen = {
			choice: new Uint16Array(1), choice2: new Uint16Array(1),
			low: new Uint16Array(VCDIFF_LZMA_POS_STATES_MAX * VCDIFF_LZMA_LEN_LOW_SYMBOLS),
			mid: new Uint16Array(VCDIFF_LZMA_POS_STATES_MAX * VCDIFF_LZMA_LEN_MID_SYMBOLS),
			high: new Uint16Array(VCDIFF_LZMA_LEN_HIGH_SYMBOLS)
		};
		lz.repLen = {
			choice: new Uint16Array(1), choice2: new Uint16Array(1),
			low: new Uint16Array(VCDIFF_LZMA_POS_STATES_MAX * VCDIFF_LZMA_LEN_LOW_SYMBOLS),
			mid: new Uint16Array(VCDIFF_LZMA_POS_STATES_MAX * VCDIFF_LZMA_LEN_MID_SYMBOLS),
			high: new Uint16Array(VCDIFF_LZMA_LEN_HIGH_SYMBOLS)
		};
	}
	this._lzmaResetProbs();
};

VCDIFF_LZMA_Stream.prototype._lzmaResetProbs = function () {
	var lz = this.lz;
	var i;
	var rows = lz.posMask + 1;
	if (lz.literal) lz.literal.fill(VCDIFF_LZMA_INIT_PROB);
	for (i = 0; i < VCDIFF_LZMA_STATES; i++) {
		lz.isRep[i] = VCDIFF_LZMA_INIT_PROB;
		lz.isRep0[i] = VCDIFF_LZMA_INIT_PROB;
		lz.isRep1[i] = VCDIFF_LZMA_INIT_PROB;
		lz.isRep2[i] = VCDIFF_LZMA_INIT_PROB;
		for (var j = 0; j < rows; j++) {
			lz.isMatch[i * VCDIFF_LZMA_POS_STATES_MAX + j] = VCDIFF_LZMA_INIT_PROB;
			lz.isRep0Long[i * VCDIFF_LZMA_POS_STATES_MAX + j] = VCDIFF_LZMA_INIT_PROB;
		}
	}
	lz.distSlot.fill(VCDIFF_LZMA_INIT_PROB);
	lz.posSpecial.fill(VCDIFF_LZMA_INIT_PROB);
	lz.posAlign.fill(VCDIFF_LZMA_INIT_PROB);
	var trees = [lz.matchLen, lz.repLen];
	for (i = 0; i < 2; i++) {
		var t = trees[i];
		t.choice[0] = VCDIFF_LZMA_INIT_PROB;
		t.choice2[0] = VCDIFF_LZMA_INIT_PROB;
		for (var k = 0; k < rows; k++) {
			for (var m = 0; m < VCDIFF_LZMA_LEN_LOW_SYMBOLS; m++) {
				t.low[k * VCDIFF_LZMA_LEN_LOW_SYMBOLS + m] = VCDIFF_LZMA_INIT_PROB;
				t.mid[k * VCDIFF_LZMA_LEN_MID_SYMBOLS + m] = VCDIFF_LZMA_INIT_PROB;
			}
		}
		t.high.fill(VCDIFF_LZMA_INIT_PROB);
	}
};

/* ----------------------------------------------------- range decoder ----- */

/* Range-coder init: five bytes, first must be 0x00 (rc_read_init). */
VCDIFF_LZMA_Stream.prototype._rcInitStep = function () {
	var lz = this.lz;
	while (lz.rcInitLeft > 0) {
		var b = this._lzmaBoundByte();
		if (b < 0) return false;
		if (lz.rcInitLeft === 5 && b !== 0x00) {
			VCDIFF_LZMA_fail("xz LZMA chunk does not start with 0x00 init byte");
		}
		lz.code = ((lz.code << 8) | b) >>> 0;
		lz.rcInitLeft--;
	}
	return true;
};

/* Reads one byte when range < 2^24 (rc_normalize). false = need input. */
VCDIFF_LZMA_Stream.prototype._rcNorm = function () {
	var lz = this.lz;
	if (lz.range >= VCDIFF_LZMA_TOP) return true;
	var b = this._lzmaBoundByte();
	if (b < 0) return false;
	lz.range = (lz.range << 8) >>> 0;
	lz.code = ((lz.code << 8) | b) >>> 0;
	return true;
};

/* Decodes one bit with a probability array entry; -1 = need input. */
VCDIFF_LZMA_Stream.prototype._rcBit = function (arr, idx) {
	if (!this._rcNorm()) return -1;
	var lz = this.lz;
	var prob = arr[idx];
	var bound = ((lz.range >>> VCDIFF_LZMA_BITS) * prob) >>> 0;
	if (lz.code < bound) {
		lz.range = bound;
		arr[idx] = prob + ((VCDIFF_LZMA_PROB_TOTAL - prob) >>> VCDIFF_LZMA_MOVE);
		return 0;
	}
	lz.range = (lz.range - bound) >>> 0;
	lz.code = (lz.code - bound) >>> 0;
	arr[idx] = prob - (prob >>> VCDIFF_LZMA_MOVE);
	return 1;
};

/* Decodes one direct (equiprobable) bit; -1 = need input (rc_direct). */
VCDIFF_LZMA_Stream.prototype._rcDirect = function () {
	if (!this._rcNorm()) return -1;
	var lz = this.lz;
	lz.range = lz.range >>> 1;
	lz.code = (lz.code - lz.range) >>> 0;
	/* After the subtraction: code wrapped (MSB set) means the original
	   code was below range/2 → bit 0; otherwise bit 1. mask is 0xFFFFFFFF
	   for bit 0 (restore code) and 0 for bit 1 (keep). */
	var mask = (0 - (lz.code >>> 31)) >>> 0;
	var bit = mask === 0xffffffff ? 0 : 1;
	lz.code = (lz.code + (lz.range & mask)) >>> 0;
	return bit;
};

/* ------------------------------------------------- lzma symbol machine -- */

/* Steps the resumable LZMA symbol decoder. Returns:
   "need"  — more input or more output space is required;
   "again" — one transition completed, keep stepping;
   "done"  — the current LZMA2 chunk finished (l2.seq is "control"). */
VCDIFF_LZMA_Stream.prototype._lzmaSymbolStep = function (out) {
	var lz = this.lz;
	for (;;) {
		if (out.pos >= out.size) return "need";
		var r;
		switch (lz.seq) {
			case "init":
			case "chunk-end":
			case "is_match":
			case "lit":
			case "lit_matched":
			case "is_rep":
			case "is_rep0":
			case "is_rep0_long":
			case "is_rep1":
			case "is_rep2":
			case "len_ch":
			case "len_ch2":
			case "len_bits":
			case "shortrep":
				r = this._lzmaStepA(out);
				break;
			default:
				r = this._lzmaStepB(out);
				break;
		}
		if (r !== "again") return r;
	}
};

VCDIFF_LZMA_Stream.prototype._lzmaStepA = function (out) {
	var lz = this.lz;
	var l2 = this.l2;
	var sym = lz.sym;

	switch (lz.seq) {
		case "init": {
			/* The LZMA2 control byte decides whether the LZMA decoder - and
			   with it the range decoder - was reset for this chunk:
			   0xA0..0xBF resets the state, 0xC0..0xFF also carries new
			   properties, and both re-initialise the range decoder with the
			   five rc_read_init bytes (first must be 0x00). 0x80..0x9F keeps
			   the previous chunk's flushed range decoder untouched. */
			if (lz.rcInitPending) {
				if (!this._rcInitStep()) return "need";
				lz.rcInitPending = false;
			}
			lz.seq = "is_match";
			return "again";
		}
		case "chunk-end": {
			/* final normalisation, then rc_is_finished: code must be 0 */
			if (!this._rcNorm()) return "need";
			if (lz.code !== 0)
				VCDIFF_LZMA_fail("xz LZMA chunk did not terminate cleanly");
			if (lz.cUsed !== lz.cLimit)
				VCDIFF_LZMA_fail(
					"xz LZMA chunk compressed-size mismatch (used " +
					lz.cUsed + " of " + lz.cLimit + ")"
				);
			l2.seq = "control";
			return "done";
		}
		case "is_match": {
			/* fresh symbol */
			var posState = l2.dictPos & lz.posMask;
			sym = lz.sym = { posState: posState };
			var b = this._rcBit(lz.isMatch, lz.state * VCDIFF_LZMA_POS_STATES_MAX + posState);
			if (b < 0) return "need";
			if (b === 0) {
				/* literal (literal_subcoder index) */
				var litBase =
					3 * ((((l2.dictPos * 256 + l2.prev) & lz.litMask) << lz.lc) >>> 0);
				sym.litBase = litBase;
				if (lz.state < 7) {
					/* update_literal_normal */
					lz.state = lz.state <= 3 ? 0 : lz.state - 3;
					sym.node = 1;
					sym.bitsLeft = 8;
					lz.seq = "lit";
				} else {
					/* update_literal_matched */
					lz.state = lz.state <= 9 ? lz.state - 3 : lz.state - 6;
					sym.node = 1;
					sym.bitsLeft = 8;
					sym.matchByte = this._dictGet(lz.reps[0]);
					sym.litOffset = 0x100;
					lz.seq = "lit_matched";
				}
				return "again";
			}
			lz.seq = "is_rep";
			return "again";
		}
		case "lit":
		case "lit_matched": {
			/* eight literal bits (rc_bittree8 / decode_with_match_bit) */
			while (sym.bitsLeft > 0) {
				var idx;
				var matchBit = 0;
				if (lz.seq === "lit") {
					idx = sym.litBase + sym.node;
				} else {
					sym.matchByte = (sym.matchByte << 1) >>> 0;
					matchBit = sym.matchByte & sym.litOffset;
					idx = sym.litBase + sym.litOffset + matchBit + sym.node;
				}
				var bit = this._rcBit(lz.literal, idx);
				if (bit < 0) return "need";
				if (lz.seq === "lit_matched") {
					if (bit) sym.litOffset &= matchBit;
					else sym.litOffset &= ~matchBit;
				}
				sym.node = bit ? (sym.node << 1) + 1 : sym.node << 1;
				sym.bitsLeft--;
			}
			this._writeOutput(out, sym.node & 0xff);
			lz.uncLeft--;
			if (lz.uncLeft === 0) {
				lz.seq = "chunk-end";
				return "again";
			}
			lz.sym = null;
			lz.seq = "is_match";
			return "again";
		}
		case "is_rep":
		case "is_rep0":
		case "is_rep0_long":
		case "is_rep1":
		case "is_rep2":
		case "shortrep":
			return this._lzmaStepRep(out);
		case "len_ch":
		case "len_ch2":
		case "len_bits":
			return this._lzmaStepLen(out);
	}
	VCDIFF_LZMA_fail("internal: unknown lzma symbol sequence");
};

VCDIFF_LZMA_Stream.prototype._lzmaStepRep = function (out) {
	var lz = this.lz;
	var sym = lz.sym;

	switch (lz.seq) {
		case "is_rep": {
			var b = this._rcBit(lz.isRep, lz.state);
			if (b < 0) return "need";
			if (b === 0) {
				/* new match: update_match(state), rotate rep history */
				lz.state = lz.state < 7 ? 7 : 10;
				lz.reps[3] = lz.reps[2];
				lz.reps[2] = lz.reps[1];
				lz.reps[1] = lz.reps[0];
				sym.tree = "match";
				sym.lenBase = 2;
				lz.seq = "len_ch";
				return "again";
			}
			lz.seq = "is_rep0";
			return "again";
		}
		case "is_rep0": {
			var b3 = this._rcBit(lz.isRep0, lz.state);
			if (b3 < 0) return "need";
			if (b3 === 1) {
				/* distance is rep1, rep2 or rep3 */
				lz.seq = "is_rep1";
				return "again";
			}
			/* distance is rep0: one byte (short rep) or a length follows */
			lz.seq = "is_rep0_long";
			return "again";
		}
		case "is_rep0_long": {
			var b4 = this._rcBit(
				lz.isRep0Long,
				lz.state * VCDIFF_LZMA_POS_STATES_MAX + sym.posState
			);
			if (b4 < 0) return "need";
			if (b4 === 0) {
				/* short rep: one byte at rep0 */
				lz.seq = "shortrep";
				return "again";
			}
			sym.tree = "rep";
			sym.lenBase = 2;
			lz.seq = "len_ch";
			return "again";
		}
		case "shortrep": {
			if (l2_full(lz, this) <= lz.reps[0])
				VCDIFF_LZMA_fail("xz LZMA match distance beyond dictionary");
			this._writeOutput(out, this._dictGet(lz.reps[0]));
			lz.uncLeft--;
			/* update_short_rep */
			lz.state = lz.state < 7 ? 9 : 11;
			if (lz.uncLeft === 0) {
				lz.seq = "chunk-end";
				return "again";
			}
			lz.sym = null;
			lz.seq = "is_match";
			return "again";
		}
		case "is_rep1": {
			var b5 = this._rcBit(lz.isRep1, lz.state);
			if (b5 < 0) return "need";
			if (b5 === 0) {
				var d1 = lz.reps[1];
				lz.reps[1] = lz.reps[0];
				lz.reps[0] = d1;
				sym.tree = "rep";
				sym.lenBase = 2;
				lz.seq = "len_ch";
				return "again";
			}
			lz.seq = "is_rep2";
			return "again";
		}
		case "is_rep2": {
			var b6 = this._rcBit(lz.isRep2, lz.state);
			if (b6 < 0) return "need";
			if (b6 === 0) {
				var d2 = lz.reps[2];
				lz.reps[2] = lz.reps[1];
				lz.reps[1] = lz.reps[0];
				lz.reps[0] = d2;
			} else {
				var d3 = lz.reps[3];
				lz.reps[3] = lz.reps[2];
				lz.reps[2] = lz.reps[1];
				lz.reps[1] = lz.reps[0];
				lz.reps[0] = d3;
			}
			sym.tree = "rep";
			sym.lenBase = 2;
			lz.seq = "len_ch";
			return "again";
		}
	}
	VCDIFF_LZMA_fail("internal: unknown lzma rep sequence");
};

/* dictFull helper for distance validation (dict_is_distance_valid). */
function l2_full(lz, self) {
	return self.l2.dictFull;
}

VCDIFF_LZMA_Stream.prototype._lzmaStepLen = function (out) {
	var lz = this.lz;
	var sym = lz.sym;

	switch (lz.seq) {
		case "len_ch": {
			/* update_long_rep(): xz applies it once, after the repeated
			   distance has been chosen and before the length is read. */
			if (sym.tree === "rep") lz.state = lz.state < 7 ? 8 : 11;
			var tree = sym.tree === "rep" ? lz.repLen : lz.matchLen;
			var ch = this._rcBit(tree.choice, 0);
			if (ch < 0) return "need";
			if (ch === 0) {
				sym.node = 1;
				sym.bitsLeft = 3;
				sym.lenArr = tree.low;
				sym.lenArrBase = sym.posState * VCDIFF_LZMA_LEN_LOW_SYMBOLS;
				sym.lenZero = VCDIFF_LZMA_LEN_LOW_SYMBOLS;
				lz.seq = "len_bits";
				return "again";
			}
			lz.seq = "len_ch2";
			return "again";
		}
		case "len_ch2": {
			var tree2 = sym.tree === "rep" ? lz.repLen : lz.matchLen;
			var ch2 = this._rcBit(tree2.choice2, 0);
			if (ch2 < 0) return "need";
			if (ch2 === 0) {
				sym.node = 1;
				sym.bitsLeft = 3;
				sym.lenArr = tree2.mid;
				sym.lenArrBase = sym.posState * VCDIFF_LZMA_LEN_MID_SYMBOLS;
				sym.lenZero = VCDIFF_LZMA_LEN_MID_SYMBOLS;
				sym.lenBase += VCDIFF_LZMA_LEN_LOW_SYMBOLS;
				lz.seq = "len_bits";
				return "again";
			}
			sym.node = 1;
			sym.bitsLeft = 8;
			sym.lenArr = tree2.high;
			sym.lenArrBase = 0;
			sym.lenZero = VCDIFF_LZMA_LEN_HIGH_SYMBOLS;
			sym.lenBase += VCDIFF_LZMA_LEN_LOW_SYMBOLS + VCDIFF_LZMA_LEN_MID_SYMBOLS;
			lz.seq = "len_bits";
			return "again";
		}
		case "len_bits": {
			while (sym.bitsLeft > 0) {
				var lb = this._rcBit(sym.lenArr, sym.lenArrBase + sym.node);
				if (lb < 0) return "need";
				sym.node = lb ? (sym.node << 1) + 1 : sym.node << 1;
				sym.bitsLeft--;
			}
			sym.len = sym.lenBase + sym.node - sym.lenZero;
			if (sym.tree === "match") {
				sym.distState =
					sym.len < VCDIFF_LZMA_DIST_STATES + VCDIFF_LZMA_MATCH_LEN_MIN
						? sym.len - VCDIFF_LZMA_MATCH_LEN_MIN
						: VCDIFF_LZMA_DIST_STATES - 1;
				sym.node = 1;
				sym.bitsLeft = 6;
				lz.seq = "dist_slot";
			} else {
				sym.copyLeft = sym.len;
				lz.seq = "copy";
			}
			return "again";
		}
	}
	VCDIFF_LZMA_fail("internal: unknown lzma length sequence");
};

VCDIFF_LZMA_Stream.prototype._lzmaStepB = function (out) {
	var lz = this.lz;
	var l2 = this.l2;
	var sym = lz.sym;

	switch (lz.seq) {
		case "dist_slot": {
			while (sym.bitsLeft > 0) {
				var b = this._rcBit(
					lz.distSlot,
					sym.distState * VCDIFF_LZMA_DIST_SLOTS + sym.node
				);
				if (b < 0) return "need";
				sym.node = b ? (sym.node << 1) + 1 : sym.node << 1;
				sym.bitsLeft--;
			}
			var slot = sym.node - VCDIFF_LZMA_DIST_SLOTS;
			if (slot < 4) {
				lz.reps[0] = slot;
				sym.copyLeft = sym.len;
				lz.seq = "copy";
				return "again";
			}
			var limit = (slot >> 1) - 1;
			if (slot < VCDIFF_LZMA_DIST_MODEL_END) {
				/* distances 4..127: reverse bittree over pos_special */
				sym.distAcc = (2 + (slot & 1)) << limit;
				sym.specialBase = sym.distAcc - slot - 1;
				sym.node = 1;
				sym.bitsLeft = limit;
				sym.offsetPow = 1;
				lz.seq = "dist_special";
				return "again";
			}
			/* distances >= 128: rc_direct(rep0, limit - ALIGN_BITS) */
			lz.reps[0] = 2 + (slot & 1);
			sym.bitsLeft = limit - VCDIFF_LZMA_ALIGN_BITS;
			lz.seq = "dist_direct";
			return "again";
		}
		case "dist_special": {
			while (sym.bitsLeft > 0) {
				var b2 = this._rcBit(lz.posSpecial, sym.specialBase + sym.node);
				if (b2 < 0) return "need";
				if (b2) sym.distAcc += sym.offsetPow;
				sym.offsetPow <<= 1;
				sym.node = b2 ? (sym.node << 1) + 1 : sym.node << 1;
				sym.bitsLeft--;
			}
			lz.reps[0] = sym.distAcc;
			sym.copyLeft = sym.len;
			lz.seq = "copy";
			return "again";
		}
		case "dist_direct": {
			while (sym.bitsLeft > 0) {
				var bd = this._rcDirect();
				if (bd < 0) return "need";
				lz.reps[0] = ((lz.reps[0] << 1) | bd) >>> 0;
				if (lz.reps[0] > 0x40000000)
					VCDIFF_LZMA_fail("xz LZMA match distance out of range");
				sym.bitsLeft--;
			}
			/* rep0 <<= ALIGN_BITS, then rc_bittree_rev4(pos_align):
			   probs[symbol + 1], +2, +4 and +8, adding 1/2/4/8 to symbol */
			lz.reps[0] = (lz.reps[0] << VCDIFF_LZMA_ALIGN_BITS) >>> 0;
			sym.node = 0;
			sym.alignSteps = [1, 2, 4, 8];
			sym.alignIdx = 0;
			lz.seq = "dist_align";
			return "again";
		}
		case "dist_align": {
			while (sym.alignIdx < 4) {
				var stepVal = sym.alignSteps[sym.alignIdx];
				var ba = this._rcBit(lz.posAlign, sym.node + stepVal);
				if (ba < 0) return "need";
				if (ba) sym.node += stepVal;
				sym.alignIdx++;
			}
			lz.reps[0] = (lz.reps[0] + sym.node) >>> 0;
			sym.copyLeft = sym.len;
			lz.seq = "copy";
			return "again";
		}
		case "copy": {
			if (l2.dictFull <= lz.reps[0])
				VCDIFF_LZMA_fail("xz LZMA match distance beyond dictionary");
			while (sym.copyLeft > 0) {
				if (out.pos >= out.size) return "need";
				if (lz.uncLeft === 0)
					VCDIFF_LZMA_fail("xz LZMA chunk output exhausted before match end");
				this._writeOutput(out, this._dictGet(lz.reps[0]));
				sym.copyLeft--;
				lz.uncLeft--;
			}
			if (lz.uncLeft === 0) {
				lz.seq = "chunk-end";
				return "again";
			}
			lz.sym = null;
			lz.seq = "is_match";
			return "again";
		}
	}
	VCDIFF_LZMA_fail("internal: unknown lzma distance sequence");
};

/* ------------------------------------------------- block terminator/index -- */

/* One xz variable-length integer (7 bits per byte, most significant first). */
VCDIFF_LZMA_Stream.prototype._idxVli = function () {
	if (this.idxVli === null) this.idxVli = { value: 0, shift: 0 };
	var vli = this.idxVli;
	for (;;) {
		var b = this._needByte();
		if (b < 0) return null;
		this.idxLen++;
		vli.value += (b & 0x7f) * Math.pow(2, vli.shift);
		vli.shift += 7;
		if ((b & 0x80) === 0) {
			this.idxVli = null;
			return vli.value;
		}
		if (vli.shift > 63)
			VCDIFF_LZMA_fail("invalid xz index variable-length integer");
	}
};

/* Block terminator: Block Padding (0-3 null bytes up to a four-byte
   boundary), the Check field of the stream's check type and then either the
   Index Indicator (0x00) or, in a multi-block stream, the next Block Header
   Size byte. Check sizes (4/8/32) are multiples of four so only the LZMA2
   data length decides the padding. */
VCDIFF_LZMA_Stream.prototype._phaseBlockPad = function () {
	var padLen = (4 - ((this.blockHeaderSize + this.dataLen) & 3)) & 3;
	var need = padLen + this.checkSize + 1;
	if (this.hdrChunk === null || this.hdrChunk.length !== need) {
		this.hdrChunk = new Uint8Array(need);
		this.hdrNeeded = 0;
	}
	var h = this._collect(need);
	if (h === null) return false;
	for (var i = 0; i < padLen; i++) {
		if (h[i] !== 0) VCDIFF_LZMA_fail("non-zero xz block padding");
	}
	/* h[padLen .. padLen+checkSize-1] is the (unverified) Check field. */
	var next = h[padLen + this.checkSize];
	if (next === 0x00) {
		/* Index Indicator, already consumed: one byte of the index. */
		this.idxLen = 1;
		this.phase = "index";
	} else {
		this.blockFirstByte = next;
		this.phase = "block-header";
	}
	return true;
};

/* Index: record count, two variable-length integers per record (unpadded
   size, uncompressed size), padding up to a four-byte boundary and a CRC32
   that is not verified. */
VCDIFF_LZMA_Stream.prototype._phaseIndex = function () {
	for (;;) {
		if (this.idxState === "count") {
			var count = this._idxVli();
			if (count === null) return false;
			this.idxRecords = count;
			this.idxState = count > 0 ? "record" : "pad";
		} else if (this.idxState === "record") {
			if (this._idxVli() === null) return false;
			this.idxState = "record2";
		} else if (this.idxState === "record2") {
			if (this._idxVli() === null) return false;
			this.idxRecords--;
			this.idxState = this.idxRecords > 0 ? "record" : "pad";
		} else if (this.idxState === "pad") {
			var padLen = (4 - (this.idxLen & 3)) & 3;
			while (this.idxPadDone < padLen) {
				var pb = this._needByte();
				if (pb < 0) return false;
				if (pb !== 0) VCDIFF_LZMA_fail("non-zero xz index padding");
				this.idxLen++;
				this.idxPadDone++;
			}
			this.idxState = "crc";
		} else if (this.idxState === "crc") {
			while (this.idxCrcDone < 4) {
				if (this._needByte() < 0) return false;
				this.idxCrcDone++;
			}
			this.phase = "footer";
			return true;
		} else {
			VCDIFF_LZMA_fail("internal: unknown xz index sequence");
		}
	}
};

/* Stream Footer: CRC32, Backward Size, Stream Flags and the "YZ" magic. A
   concatenated xz stream (or another xdelta3 stream slice) may follow. */
VCDIFF_LZMA_Stream.prototype._phaseFooter = function () {
	var f = this._collect(12);
	if (f === null) return false;
	if (f[8] !== 0x00 || f[9] !== this.checkType)
		VCDIFF_LZMA_fail("xz stream footer flags mismatch");
	if (f[10] !== 0x59 || f[11] !== 0x5a)
		VCDIFF_LZMA_fail("bad xz stream footer magic");
	this.phase = "stream-header";
	return true;
};

/* ---------------------------------------------------------------- decoder -- */

/* Drives the resumable xz decoder state machine. Returns false when more
   input is needed (the state is preserved for the next call). */
VCDIFF_LZMA_Stream.prototype._step = function (out) {
	if (this.phase === "stream-header") return this._phaseStreamHeader();
	if (this.phase === "block-header") return this._phaseBlockHeader();
	if (this.phase === "lzma2") return this._lzma2Step(out);
	if (this.phase === "block-pad") return this._phaseBlockPad();
	if (this.phase === "index") return this._phaseIndex();
	if (this.phase === "footer") return this._phaseFooter();
	VCDIFF_LZMA_fail("internal: unknown xz decoder phase");
};

/**
 * Feeds one VCDIFF secondary section slice and returns up to `outSize`
 * bytes. `u8` holds the section's compressed bytes only: the caller strips
 * the 7-bit uncompressed-size varint that xdelta3 writes in front of every
 * secondary-compressed section (xdelta3-second.h xd3_decode_secondary emits
 * it with xd3_emit_size and reads it with xd3_read_size).
 *
 * One stream object per section type persists across all windows of an
 * apply pass (xdelta3 keeps its lzma_stream alive in xd3_get_secondary and
 * issues LZMA_SYNC_FLUSH at every window boundary), so a chunk that started
 * in one window continues in the next. Input that is left over once
 * `outSize` bytes have been produced is kept for the next call.
 *
 * Resumable semantics: a call may return fewer than `outSize` bytes when
 * its input slice (or output budget) runs out first; decoder state is
 * preserved and the next feed continues. Callers that need exactly
 * `outSize` bytes keep feeding until the span is assembled. The VCDIFF
 * applier hands over each whole section at once, so a short return there
 * means the section is truncated.
 */
VCDIFF_LZMA_Stream.prototype.feed = function (u8, outSize) {
	if (u8 && u8.length > 0) {
		var pending = this.inBuf.length - this.inPos;
		if (pending > 0) {
			var merged = new Uint8Array(pending + u8.length);
			merged.set(this.inBuf.subarray(this.inPos), 0);
			merged.set(u8, pending);
			this.inBuf = merged;
		} else {
			this.inBuf = u8;
		}
		this.inPos = 0;
	}

	var out = { buf: new Uint8Array(outSize), pos: 0, size: outSize };
	while (out.pos < out.size) {
		var inBefore = this.inPos;
		var outBefore = out.pos;
		var st = this._step(out);
		if (st === false || st === "need") {
			/* false: a header phase needs more input. "need" from the
			   symbol machine means either input or output ran out:
			   return what was produced so far and let the caller feed
			   more input (or a fresh output budget); leftover state is
			   preserved for the next call. */
			break;
		}
		if (this.inPos === inBefore && out.pos === outBefore) {
			/* Header-only phases (stream/block headers, padding, index,
			   footer) legitimately consume no input and emit no output
			   on a single transition; other phases must advance. */
			if (
				this.phase === "stream-header" || this.phase === "block-header" ||
				this.phase === "block-pad" || this.phase === "index" ||
				this.phase === "footer"
			) continue;
			VCDIFF_LZMA_fail("internal: xz decoder made no progress");
		}
	}

	if (out.pos === out.size) return out.buf;
	if (out.pos > 0 && this.inPos >= this.inBuf.length && out.pos < out.size) {
		/* Partial output: the caller sliced the input or capped the output
		   budget. Hand back the produced prefix; leftover decoder state is
		   preserved and the next feed continues where this one stopped.
		   Callers that need exactly `outSize` bytes must keep feeding until
		   the full span is assembled (the VCDIFF applier always hands over a
		   whole section, so it still receives the complete slice). */
		return out.buf.subarray(0, out.pos);
	}
	VCDIFF_LZMA_fail(
		"truncated xz secondary stream (" + out.pos + " of " +
		out.size + " bytes decoded)"
	);
};

if (typeof module !== "undefined" && module.exports)
	module.exports = VCDIFF_LZMA_Stream;
