var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var aspromise = asPromise;
function asPromise(fn, ctx              ) {
    var params  = new Array(arguments.length - 1),
        offset  = 0,
        index   = 2,
        pending = true;
    while (index < arguments.length)
        params[offset++] = arguments[index++];
    return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err              ) {
            if (pending) {
                pending = false;
                if (err)
                    reject(err);
                else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length)
                        params[offset++] = arguments[offset];
                    resolve.apply(null, params);
                }
            }
        };
        try {
            fn.apply(ctx || null, params);
        } catch (err) {
            if (pending) {
                pending = false;
                reject(err);
            }
        }
    });
}

var base64_1 = createCommonjsModule(function (module, exports) {
var base64 = exports;
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};
var b64 = new Array(64);
var s64 = new Array(123);
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0,
        j = 0,
        t;
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};
var invalidEncoding = "invalid encoding";
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0,
        t;
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};
});

var eventemitter = EventEmitter;
function EventEmitter() {
    this._listeners = {};
}
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn  : fn,
        ctx : ctx || this
    });
    return this;
};
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined)
        this._listeners = {};
    else {
        if (fn === undefined)
            this._listeners[evt] = [];
        else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;)
                if (listeners[i].fn === fn)
                    listeners.splice(i, 1);
                else
                    ++i;
        }
    }
    return this;
};
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;)
            args.push(arguments[i++]);
        for (i = 0; i < listeners.length;)
            listeners[i].fn.apply(listeners[i++].ctx, args);
    }
    return this;
};

var float_1 = factory(factory);
function factory(exports) {
    if (typeof Float32Array !== "undefined") (function() {
        var f32 = new Float32Array([ -0 ]),
            f8b = new Uint8Array(f32.buffer),
            le  = f8b[3] === 128;
        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }
        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }
        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos    ];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
    })(); else (function() {
        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0)
                writeUint(1 / val > 0 ?                0 :                  2147483648, buf, pos);
            else if (isNaN(val))
                writeUint(2143289344, buf, pos);
            else if (val > 3.4028234663852886e+38)
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 1.1754943508222875e-38)
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
            else {
                var exponent = Math.floor(Math.log(val) / Math.LN2),
                    mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
        }
        exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
        function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos),
                sign = (uint >> 31) * 2 + 1,
                exponent = uint >>> 23 & 255,
                mantissa = uint & 8388607;
            return exponent === 255
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0
                ? sign * 1.401298464324817e-45 * mantissa
                : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }
        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
    })();
    if (typeof Float64Array !== "undefined") (function() {
        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le  = f8b[7] === 128;
        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
        }
        function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
        }
        function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos    ];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
    })(); else (function() {
        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ?                0 :                  2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) {
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) {
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024)
                        exponent = 1023;
                    mantissa = val * Math.pow(2, -exponent);
                    writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                }
            }
        }
        exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0),
                hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1,
                exponent = hi >>> 20 & 2047,
                mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0
                ? sign * 5e-324 * mantissa
                : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }
        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
    })();
    return exports;
}
function writeUintLE(val, buf, pos) {
    buf[pos    ] =  val        & 255;
    buf[pos + 1] =  val >>> 8  & 255;
    buf[pos + 2] =  val >>> 16 & 255;
    buf[pos + 3] =  val >>> 24;
}
function writeUintBE(val, buf, pos) {
    buf[pos    ] =  val >>> 24;
    buf[pos + 1] =  val >>> 16 & 255;
    buf[pos + 2] =  val >>> 8  & 255;
    buf[pos + 3] =  val        & 255;
}
function readUintLE(buf, pos) {
    return (buf[pos    ]
          | buf[pos + 1] << 8
          | buf[pos + 2] << 16
          | buf[pos + 3] << 24) >>> 0;
}
function readUintBE(buf, pos) {
    return (buf[pos    ] << 24
          | buf[pos + 1] << 16
          | buf[pos + 2] << 8
          | buf[pos + 3]) >>> 0;
}

var inquire_1 = inquire;
function inquire(moduleName) {
    return null;
}

var utf8_1 = createCommonjsModule(function (module, exports) {
var utf8 = exports;
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0,
        t;
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1,
        c2;
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};
});

var pool_1 = pool;
function pool(alloc, slice, size) {
    var SIZE   = size || 8192;
    var MAX    = SIZE >>> 1;
    var slab   = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX)
            return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7)
            offset = (offset | 7) + 1;
        return buf;
    };
}

var longbits = LongBits;
function LongBits(lo, hi) {
    this.lo = lo >>> 0;
    this.hi = hi >>> 0;
}
var zero = LongBits.zero = new LongBits(0, 0);
zero.toNumber = function() { return 0; };
zero.zzEncode = zero.zzDecode = function() { return this; };
zero.length = function() { return 1; };
var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
LongBits.fromNumber = function fromNumber(value) {
    if (value === 0)
        return zero;
    var sign = value < 0;
    if (sign)
        value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
                hi = 0;
        }
    }
    return new LongBits(lo, hi);
};
LongBits.from = function from(value) {
    if (typeof value === "number")
        return LongBits.fromNumber(value);
    if (minimal.isString(value)) {
        if (minimal.Long)
            value = minimal.Long.fromString(value);
        else
            return LongBits.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
};
LongBits.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi     >>> 0;
        if (!lo)
            hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};
LongBits.prototype.toLong = function toLong(unsigned) {
    return minimal.Long
        ? new minimal.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
        : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};
var charCodeAt = String.prototype.charCodeAt;
LongBits.fromHash = function fromHash(hash) {
    if (hash === zeroHash)
        return zero;
    return new LongBits(
        ( charCodeAt.call(hash, 0)
        | charCodeAt.call(hash, 1) << 8
        | charCodeAt.call(hash, 2) << 16
        | charCodeAt.call(hash, 3) << 24) >>> 0
    ,
        ( charCodeAt.call(hash, 4)
        | charCodeAt.call(hash, 5) << 8
        | charCodeAt.call(hash, 6) << 16
        | charCodeAt.call(hash, 7) << 24) >>> 0
    );
};
LongBits.prototype.toHash = function toHash() {
    return String.fromCharCode(
        this.lo        & 255,
        this.lo >>> 8  & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24      ,
        this.hi        & 255,
        this.hi >>> 8  & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
    );
};
LongBits.prototype.zzEncode = function zzEncode() {
    var mask =   this.hi >> 31;
    this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
    return this;
};
LongBits.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
    return this;
};
LongBits.prototype.length = function length() {
    var part0 =  this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 =  this.hi >>> 24;
    return part2 === 0
         ? part1 === 0
           ? part0 < 16384
             ? part0 < 128 ? 1 : 2
             : part0 < 2097152 ? 3 : 4
           : part1 < 16384
             ? part1 < 128 ? 5 : 6
             : part1 < 2097152 ? 7 : 8
         : part2 < 128 ? 9 : 10;
};

var minimal = createCommonjsModule(function (module, exports) {
var util = exports;
util.asPromise = aspromise;
util.base64 = base64_1;
util.EventEmitter = eventemitter;
util.float = float_1;
util.inquire = inquire_1;
util.utf8 = utf8_1;
util.pool = pool_1;
util.LongBits = longbits;
util.global = typeof window !== "undefined" && window
           || typeof commonjsGlobal !== "undefined" && commonjsGlobal
           || typeof self   !== "undefined" && self
           || commonjsGlobal;
util.emptyArray = Object.freeze ? Object.freeze([]) :                            [];
util.emptyObject = Object.freeze ? Object.freeze({}) :                            {};
util.isNode = Boolean(util.global.process && util.global.process.versions && util.global.process.versions.node);
util.isInteger = Number.isInteger ||                            function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};
util.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
};
util.isObject = function isObject(value) {
    return value && typeof value === "object";
};
util.isset =
util.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop))
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
};
util.Buffer = (function() {
    try {
        var Buffer = util.inquire("buffer").Buffer;
        return Buffer.prototype.utf8Write ? Buffer :                            null;
    } catch (e) {
        return null;
    }
})();
util._Buffer_from = null;
util._Buffer_allocUnsafe = null;
util.newBuffer = function newBuffer(sizeOrArray) {
    return typeof sizeOrArray === "number"
        ? util.Buffer
            ? util._Buffer_allocUnsafe(sizeOrArray)
            : new util.Array(sizeOrArray)
        : util.Buffer
            ? util._Buffer_from(sizeOrArray)
            : typeof Uint8Array === "undefined"
                ? sizeOrArray
                : new Uint8Array(sizeOrArray);
};
util.Array = typeof Uint8Array !== "undefined" ? Uint8Array                            : Array;
util.Long =                            util.global.dcodeIO &&                            util.global.dcodeIO.Long
         ||                            util.global.Long
         || util.inquire("long");
util.key2Re = /^true|false|0|1$/;
util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
util.longToHash = function longToHash(value) {
    return value
        ? util.LongBits.from(value).toHash()
        : util.LongBits.zeroHash;
};
util.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util.LongBits.fromHash(hash);
    if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
};
function merge(dst, src, ifNotSet) {
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
}
util.merge = merge;
util.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
};
function newError(name) {
    function CustomError(message, properties) {
        if (!(this instanceof CustomError))
            return new CustomError(message, properties);
        Object.defineProperty(this, "message", { get: function() { return message; } });
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, CustomError);
        else
            Object.defineProperty(this, "stack", { value: (new Error()).stack || "" });
        if (properties)
            merge(this, properties);
    }
    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;
    Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });
    CustomError.prototype.toString = function toString() {
        return this.name + ": " + this.message;
    };
    return CustomError;
}
util.newError = newError;
util.ProtocolError = newError("ProtocolError");
util.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;
    return function() {
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
            if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                return keys[i];
    };
};
util.oneOfSetter = function setOneOf(fieldNames) {
    return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
                delete this[fieldNames[i]];
    };
};
util.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
};
util._configure = function() {
    var Buffer = util.Buffer;
    if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
    }
    util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
    util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
};
});

var writer = Writer;
var BufferWriter;
var LongBits$1  = minimal.LongBits,
    base64    = minimal.base64,
    utf8      = minimal.utf8;
function Op(fn, len, val) {
    this.fn = fn;
    this.len = len;
    this.next = undefined;
    this.val = val;
}
function noop() {}
function State(writer) {
    this.head = writer.head;
    this.tail = writer.tail;
    this.len = writer.len;
    this.next = writer.states;
}
function Writer() {
    this.len = 0;
    this.head = new Op(noop, 0, 0);
    this.tail = this.head;
    this.states = null;
}
Writer.create = minimal.Buffer
    ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
            return new BufferWriter();
        })();
    }
    : function create_array() {
        return new Writer();
    };
Writer.alloc = function alloc(size) {
    return new minimal.Array(size);
};
if (minimal.Array !== Array)
    Writer.alloc = minimal.pool(Writer.alloc, minimal.Array.prototype.subarray);
Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};
function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
}
function writeVarint32(val, buf, pos) {
    while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
    }
    buf[pos] = val;
}
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}
VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;
Writer.prototype.uint32 = function write_uint32(value) {
    this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0)
                < 128       ? 1
        : value < 16384     ? 2
        : value < 2097152   ? 3
        : value < 268435456 ? 4
        :                     5,
    value)).len;
    return this;
};
Writer.prototype.int32 = function write_int32(value) {
    return value < 0
        ? this._push(writeVarint64, 10, LongBits$1.fromNumber(value))
        : this.uint32(value);
};
Writer.prototype.sint32 = function write_sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
};
function writeVarint64(val, buf, pos) {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
        val.hi >>>= 7;
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
}
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits$1.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};
Writer.prototype.int64 = Writer.prototype.uint64;
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits$1.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};
function writeFixed32(val, buf, pos) {
    buf[pos    ] =  val         & 255;
    buf[pos + 1] =  val >>> 8   & 255;
    buf[pos + 2] =  val >>> 16  & 255;
    buf[pos + 3] =  val >>> 24;
}
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};
Writer.prototype.sfixed32 = Writer.prototype.fixed32;
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits$1.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};
Writer.prototype.sfixed64 = Writer.prototype.fixed64;
Writer.prototype.float = function write_float(value) {
    return this._push(minimal.float.writeFloatLE, 4, value);
};
Writer.prototype.double = function write_double(value) {
    return this._push(minimal.float.writeDoubleLE, 8, value);
};
var writeBytes = minimal.Array.prototype.set
    ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos);
    }
    : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
            buf[pos + i] = val[i];
    };
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len)
        return this._push(writeByte, 1, 0);
    if (minimal.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len
        ? this.uint32(len)._push(utf8.write, len, value)
        : this._push(writeByte, 1, 0);
};
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next;
        this.tail = tail;
        this.len += len;
    }
    return this;
};
Writer.prototype.finish = function finish() {
    var head = this.head.next,
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    return buf;
};
Writer._configure = function(BufferWriter_) {
    BufferWriter = BufferWriter_;
};

var writer_buffer = BufferWriter$1;
(BufferWriter$1.prototype = Object.create(writer.prototype)).constructor = BufferWriter$1;
var Buffer = minimal.Buffer;
function BufferWriter$1() {
    writer.call(this);
}
BufferWriter$1.alloc = function alloc_buffer(size) {
    return (BufferWriter$1.alloc = minimal._Buffer_allocUnsafe)(size);
};
var writeBytesBuffer = Buffer && Buffer.prototype instanceof Uint8Array && Buffer.prototype.set.name === "set"
    ? function writeBytesBuffer_set(val, buf, pos) {
        buf.set(val, pos);
    }
    : function writeBytesBuffer_copy(val, buf, pos) {
        if (val.copy)
            val.copy(buf, pos, 0, val.length);
        else for (var i = 0; i < val.length;)
            buf[pos++] = val[i++];
    };
BufferWriter$1.prototype.bytes = function write_bytes_buffer(value) {
    if (minimal.isString(value))
        value = minimal._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len)
        this._push(writeBytesBuffer, len, value);
    return this;
};
function writeStringBuffer(val, buf, pos) {
    if (val.length < 40)
        minimal.utf8.write(val, buf, pos);
    else
        buf.utf8Write(val, pos);
}
BufferWriter$1.prototype.string = function write_string_buffer(value) {
    var len = Buffer.byteLength(value);
    this.uint32(len);
    if (len)
        this._push(writeStringBuffer, len, value);
    return this;
};

var reader = Reader;
var BufferReader;
var LongBits$2  = minimal.LongBits,
    utf8$1      = minimal.utf8;
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}
function Reader(buffer) {
    this.buf = buffer;
    this.pos = 0;
    this.len = buffer.length;
}
var create_array = typeof Uint8Array !== "undefined"
    ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    }
    : function create_array(buffer) {
        if (Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    };
Reader.create = minimal.Buffer
    ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer) {
            return minimal.Buffer.isBuffer(buffer)
                ? new BufferReader(buffer)
                : create_array(buffer);
        })(buffer);
    }
    : create_array;
Reader.prototype._slice = minimal.Array.prototype.subarray ||                            minimal.Array.prototype.slice;
Reader.prototype.uint32 = (function read_uint32_setup() {
    var value = 4294967295;
    return function read_uint32() {
        value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
})();
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};
function readLongVarint() {
    var bits = new LongBits$2(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) {
        for (; i < 4; ++i) {
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) {
        for (; i < 5; ++i) {
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    throw Error("invalid varint encoding");
}
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};
function readFixed32_end(buf, end) {
    return (buf[end - 4]
          | buf[end - 3] << 8
          | buf[end - 2] << 16
          | buf[end - 1] << 24) >>> 0;
}
Reader.prototype.fixed32 = function read_fixed32() {
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
    return readFixed32_end(this.buf, this.pos += 4);
};
Reader.prototype.sfixed32 = function read_sfixed32() {
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
    return readFixed32_end(this.buf, this.pos += 4) | 0;
};
function readFixed64(                  ) {
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);
    return new LongBits$2(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}
Reader.prototype.float = function read_float() {
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
    var value = minimal.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};
Reader.prototype.double = function read_double() {
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);
    var value = minimal.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start  = this.pos,
        end    = this.pos + length;
    if (end > this.len)
        throw indexOutOfRange(this, length);
    this.pos += length;
    if (Array.isArray(this.buf))
        return this.buf.slice(start, end);
    return start === end
        ? new this.buf.constructor(0)
        : this._slice.call(this.buf, start, end);
};
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8$1.read(bytes, 0, bytes.length);
};
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};
Reader.prototype.skipType = function(wireType) {
    switch (wireType) {
        case 0:
            this.skip();
            break;
        case 1:
            this.skip(8);
            break;
        case 2:
            this.skip(this.uint32());
            break;
        case 3:
            while ((wireType = this.uint32() & 7) !== 4) {
                this.skipType(wireType);
            }
            break;
        case 5:
            this.skip(4);
            break;
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};
Reader._configure = function(BufferReader_) {
    BufferReader = BufferReader_;
    var fn = minimal.Long ? "toLong" :                            "toNumber";
    minimal.merge(Reader.prototype, {
        int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
        },
        uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
        },
        sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
        },
        fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
        },
        sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
        }
    });
};

var reader_buffer = BufferReader$1;
(BufferReader$1.prototype = Object.create(reader.prototype)).constructor = BufferReader$1;
function BufferReader$1(buffer) {
    reader.call(this, buffer);
}
if (minimal.Buffer)
    BufferReader$1.prototype._slice = minimal.Buffer.prototype.slice;
BufferReader$1.prototype.string = function read_string_buffer() {
    var len = this.uint32();
    return this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len));
};

var service = Service;
(Service.prototype = Object.create(minimal.EventEmitter.prototype)).constructor = Service;
function Service(rpcImpl, requestDelimited, responseDelimited) {
    if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");
    minimal.EventEmitter.call(this);
    this.rpcImpl = rpcImpl;
    this.requestDelimited = Boolean(requestDelimited);
    this.responseDelimited = Boolean(responseDelimited);
}
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
    if (!request)
        throw TypeError("request must be specified");
    var self = this;
    if (!callback)
        return minimal.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);
    if (!self.rpcImpl) {
        setTimeout(function() { callback(Error("already ended")); }, 0);
        return undefined;
    }
    try {
        return self.rpcImpl(
            method,
            requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {
                if (err) {
                    self.emit("error", err, method);
                    return callback(err);
                }
                if (response === null) {
                    self.end(                 true);
                    return undefined;
                }
                if (!(response instanceof responseCtor)) {
                    try {
                        response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                    } catch (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }
                }
                self.emit("data", response, method);
                return callback(null, response);
            }
        );
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function() { callback(err); }, 0);
        return undefined;
    }
};
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC)
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};

var rpc_1 = createCommonjsModule(function (module, exports) {
var rpc = exports;
rpc.Service = service;
});

var roots = {};

var indexMinimal = createCommonjsModule(function (module, exports) {
var protobuf = exports;
protobuf.build = "minimal";
protobuf.Writer       = writer;
protobuf.BufferWriter = writer_buffer;
protobuf.Reader       = reader;
protobuf.BufferReader = reader_buffer;
protobuf.util         = minimal;
protobuf.rpc          = rpc_1;
protobuf.roots        = roots;
protobuf.configure    = configure;
function configure() {
    protobuf.Reader._configure(protobuf.BufferReader);
    protobuf.util._configure();
}
protobuf.Writer._configure(protobuf.BufferWriter);
configure();
});

var minimal$1 = indexMinimal;
var minimal_1 = minimal$1.Reader;
var minimal_2 = minimal$1.Writer;
var minimal_3 = minimal$1.util;
var minimal_4 = minimal$1.roots;

var $Reader = minimal_1, $Writer = minimal_2, $util = minimal_3;
var $root = minimal_4["default"] || (minimal_4["default"] = {});
var Message = $root.Message = (function () {
    function Message(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }
    Message.prototype.senderId = 0;
    Message.prototype.recipientId = 0;
    Message.prototype.serviceId = 0;
    Message.prototype.content = $util.newBuffer([]);
    Message.create = function create(properties) {
        return new Message(properties);
    };
    Message.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.senderId != null && message.hasOwnProperty("senderId"))
            writer.uint32(8).uint32(message.senderId);
        if (message.recipientId != null && message.hasOwnProperty("recipientId"))
            writer.uint32(16).uint32(message.recipientId);
        if (message.serviceId != null && message.hasOwnProperty("serviceId"))
            writer.uint32(24).uint32(message.serviceId);
        if (message.content != null && message.hasOwnProperty("content"))
            writer.uint32(34).bytes(message.content);
        return writer;
    };
    Message.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Message();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.senderId = reader.uint32();
                    break;
                case 2:
                    message.recipientId = reader.uint32();
                    break;
                case 3:
                    message.serviceId = reader.uint32();
                    break;
                case 4:
                    message.content = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    };
    return Message;
})();
var userMessage = $root.userMessage = (function () {
    var userMessage = {};
    userMessage.Message = (function () {
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Message.prototype.length = 0;
        Message.prototype.type = 0;
        Message.prototype.full = $util.newBuffer([]);
        Message.prototype.chunk = null;
        var $oneOfFields;
        Object.defineProperty(Message.prototype, "contentType", {
            get: $util.oneOfGetter($oneOfFields = ["full", "chunk"]),
            set: $util.oneOfSetter($oneOfFields)
        });
        Message.create = function create(properties) {
            return new Message(properties);
        };
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.length != null && message.hasOwnProperty("length"))
                writer.uint32(8).uint32(message.length);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(16).int32(message.type);
            if (message.full != null && message.hasOwnProperty("full"))
                writer.uint32(26).bytes(message.full);
            if (message.chunk != null && message.hasOwnProperty("chunk"))
                $root.userMessage.Message.Chunk.encode(message.chunk, writer.uint32(34).fork()).ldelim();
            return writer;
        };
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.userMessage.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.length = reader.uint32();
                        break;
                    case 2:
                        message.type = reader.int32();
                        break;
                    case 3:
                        message.full = reader.bytes();
                        break;
                    case 4:
                        message.chunk = $root.userMessage.Message.Chunk.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        Message.Chunk = (function () {
            function Chunk(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
            Chunk.prototype.id = 0;
            Chunk.prototype.nb = 0;
            Chunk.prototype.content = $util.newBuffer([]);
            Chunk.create = function create(properties) {
                return new Chunk(properties);
            };
            Chunk.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.id != null && message.hasOwnProperty("id"))
                    writer.uint32(8).uint32(message.id);
                if (message.nb != null && message.hasOwnProperty("nb"))
                    writer.uint32(16).uint32(message.nb);
                if (message.content != null && message.hasOwnProperty("content"))
                    writer.uint32(34).bytes(message.content);
                return writer;
            };
            Chunk.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.userMessage.Message.Chunk();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            message.id = reader.uint32();
                            break;
                        case 2:
                            message.nb = reader.uint32();
                            break;
                        case 4:
                            message.content = reader.bytes();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return message;
            };
            return Chunk;
        })();
        Message.Type = (function () {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "STRING"] = 0;
            values[valuesById[1] = "U_INT_8_ARRAY"] = 1;
            return values;
        })();
        return Message;
    })();
    return userMessage;
})();
var channelBuilder = $root.channelBuilder = (function () {
    var channelBuilder = {};
    channelBuilder.Message = (function () {
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Message.prototype.negotiation = null;
        Message.prototype.connectionRequest = $util.newBuffer([]);
        Message.prototype.connectionResponse = false;
        var $oneOfFields;
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["negotiation", "connectionRequest", "connectionResponse"]),
            set: $util.oneOfSetter($oneOfFields)
        });
        Message.create = function create(properties) {
            return new Message(properties);
        };
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.negotiation != null && message.hasOwnProperty("negotiation"))
                $root.channelBuilder.Negotiation.encode(message.negotiation, writer.uint32(10).fork()).ldelim();
            if (message.connectionRequest != null && message.hasOwnProperty("connectionRequest"))
                writer.uint32(18).bytes(message.connectionRequest);
            if (message.connectionResponse != null && message.hasOwnProperty("connectionResponse"))
                writer.uint32(24).bool(message.connectionResponse);
            return writer;
        };
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.channelBuilder.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.negotiation = $root.channelBuilder.Negotiation.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.connectionRequest = reader.bytes();
                        break;
                    case 3:
                        message.connectionResponse = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Message;
    })();
    channelBuilder.Negotiation = (function () {
        function Negotiation(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Negotiation.prototype.initiator = null;
        Negotiation.prototype.passive = null;
        Negotiation.create = function create(properties) {
            return new Negotiation(properties);
        };
        Negotiation.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.initiator != null && message.hasOwnProperty("initiator"))
                $root.channelBuilder.Info.encode(message.initiator, writer.uint32(10).fork()).ldelim();
            if (message.passive != null && message.hasOwnProperty("passive"))
                $root.channelBuilder.Info.encode(message.passive, writer.uint32(18).fork()).ldelim();
            return writer;
        };
        Negotiation.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.channelBuilder.Negotiation();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.initiator = $root.channelBuilder.Info.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.passive = $root.channelBuilder.Info.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Negotiation;
    })();
    channelBuilder.Info = (function () {
        function Info(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Info.prototype.id = 0;
        Info.prototype.wss = "";
        Info.prototype.wcId = 0;
        Info.prototype.wsSupported = false;
        Info.prototype.wsTried = false;
        Info.prototype.dcSupported = false;
        Info.prototype.dcTried = false;
        Info.create = function create(properties) {
            return new Info(properties);
        };
        Info.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(8).uint32(message.id);
            if (message.wss != null && message.hasOwnProperty("wss"))
                writer.uint32(18).string(message.wss);
            if (message.wcId != null && message.hasOwnProperty("wcId"))
                writer.uint32(24).uint32(message.wcId);
            if (message.wsSupported != null && message.hasOwnProperty("wsSupported"))
                writer.uint32(32).bool(message.wsSupported);
            if (message.wsTried != null && message.hasOwnProperty("wsTried"))
                writer.uint32(40).bool(message.wsTried);
            if (message.dcSupported != null && message.hasOwnProperty("dcSupported"))
                writer.uint32(48).bool(message.dcSupported);
            if (message.dcTried != null && message.hasOwnProperty("dcTried"))
                writer.uint32(56).bool(message.dcTried);
            return writer;
        };
        Info.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.channelBuilder.Info();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
                        message.wss = reader.string();
                        break;
                    case 3:
                        message.wcId = reader.uint32();
                        break;
                    case 4:
                        message.wsSupported = reader.bool();
                        break;
                    case 5:
                        message.wsTried = reader.bool();
                        break;
                    case 6:
                        message.dcSupported = reader.bool();
                        break;
                    case 7:
                        message.dcTried = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Info;
    })();
    return channelBuilder;
})();
var fullMesh = $root.fullMesh = (function () {
    var fullMesh = {};
    fullMesh.Message = (function () {
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Message.prototype.members = null;
        Message.prototype.adjacentMembers = null;
        Message.prototype.heartbeat = false;
        var $oneOfFields;
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["members", "adjacentMembers", "heartbeat"]),
            set: $util.oneOfSetter($oneOfFields)
        });
        Message.create = function create(properties) {
            return new Message(properties);
        };
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.members != null && message.hasOwnProperty("members"))
                $root.fullMesh.Peers.encode(message.members, writer.uint32(10).fork()).ldelim();
            if (message.adjacentMembers != null && message.hasOwnProperty("adjacentMembers"))
                $root.fullMesh.Peers.encode(message.adjacentMembers, writer.uint32(26).fork()).ldelim();
            if (message.heartbeat != null && message.hasOwnProperty("heartbeat"))
                writer.uint32(32).bool(message.heartbeat);
            return writer;
        };
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullMesh.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.members = $root.fullMesh.Peers.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.adjacentMembers = $root.fullMesh.Peers.decode(reader, reader.uint32());
                        break;
                    case 4:
                        message.heartbeat = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Message;
    })();
    fullMesh.Peers = (function () {
        function Peers(properties) {
            this.ids = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Peers.prototype.ids = $util.emptyArray;
        Peers.create = function create(properties) {
            return new Peers(properties);
        };
        Peers.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ids != null && message.ids.length) {
                writer.uint32(10).fork();
                for (var i = 0; i < message.ids.length; ++i)
                    writer.uint32(message.ids[i]);
                writer.ldelim();
            }
            return writer;
        };
        Peers.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullMesh.Peers();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        if (!(message.ids && message.ids.length))
                            message.ids = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.ids.push(reader.uint32());
                        }
                        else
                            message.ids.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Peers;
    })();
    fullMesh.ConnectionRequest = (function () {
        function ConnectionRequest(properties) {
            this.adjacentIds = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        ConnectionRequest.prototype.id = 0;
        ConnectionRequest.prototype.adjacentIds = $util.emptyArray;
        ConnectionRequest.create = function create(properties) {
            return new ConnectionRequest(properties);
        };
        ConnectionRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(8).uint32(message.id);
            if (message.adjacentIds != null && message.adjacentIds.length) {
                writer.uint32(18).fork();
                for (var i = 0; i < message.adjacentIds.length; ++i)
                    writer.uint32(message.adjacentIds[i]);
                writer.ldelim();
            }
            return writer;
        };
        ConnectionRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.fullMesh.ConnectionRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
                        if (!(message.adjacentIds && message.adjacentIds.length))
                            message.adjacentIds = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.adjacentIds.push(reader.uint32());
                        }
                        else
                            message.adjacentIds.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return ConnectionRequest;
    })();
    return fullMesh;
})();
var dataChannelBuilder = $root.dataChannelBuilder = (function () {
    var dataChannelBuilder = {};
    dataChannelBuilder.Message = (function () {
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Message.prototype.offer = "";
        Message.prototype.answer = "";
        Message.prototype.candidate = null;
        var $oneOfFields;
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["offer", "answer", "candidate"]),
            set: $util.oneOfSetter($oneOfFields)
        });
        Message.create = function create(properties) {
            return new Message(properties);
        };
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.offer != null && message.hasOwnProperty("offer"))
                writer.uint32(10).string(message.offer);
            if (message.answer != null && message.hasOwnProperty("answer"))
                writer.uint32(18).string(message.answer);
            if (message.candidate != null && message.hasOwnProperty("candidate"))
                $root.dataChannelBuilder.IceCandidate.encode(message.candidate, writer.uint32(26).fork()).ldelim();
            return writer;
        };
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dataChannelBuilder.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.offer = reader.string();
                        break;
                    case 2:
                        message.answer = reader.string();
                        break;
                    case 3:
                        message.candidate = $root.dataChannelBuilder.IceCandidate.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Message;
    })();
    dataChannelBuilder.IceCandidate = (function () {
        function IceCandidate(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        IceCandidate.prototype.candidate = "";
        IceCandidate.prototype.sdpMid = "";
        IceCandidate.prototype.sdpMLineIndex = 0;
        IceCandidate.create = function create(properties) {
            return new IceCandidate(properties);
        };
        IceCandidate.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.candidate != null && message.hasOwnProperty("candidate"))
                writer.uint32(10).string(message.candidate);
            if (message.sdpMid != null && message.hasOwnProperty("sdpMid"))
                writer.uint32(18).string(message.sdpMid);
            if (message.sdpMLineIndex != null && message.hasOwnProperty("sdpMLineIndex"))
                writer.uint32(24).uint32(message.sdpMLineIndex);
            return writer;
        };
        IceCandidate.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dataChannelBuilder.IceCandidate();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.candidate = reader.string();
                        break;
                    case 2:
                        message.sdpMid = reader.string();
                        break;
                    case 3:
                        message.sdpMLineIndex = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return IceCandidate;
    })();
    return dataChannelBuilder;
})();
var channel = $root.channel = (function () {
    var channel = {};
    channel.Message = (function () {
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Message.prototype.initPing = null;
        Message.prototype.initPong = 0;
        var $oneOfFields;
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["initPing", "initPong"]),
            set: $util.oneOfSetter($oneOfFields)
        });
        Message.create = function create(properties) {
            return new Message(properties);
        };
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.initPing != null && message.hasOwnProperty("initPing"))
                $root.channel.Data.encode(message.initPing, writer.uint32(10).fork()).ldelim();
            if (message.initPong != null && message.hasOwnProperty("initPong"))
                writer.uint32(16).uint32(message.initPong);
            return writer;
        };
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.channel.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.initPing = $root.channel.Data.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.initPong = reader.uint32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Message;
    })();
    channel.Data = (function () {
        function Data(properties) {
            this.members = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Data.prototype.topology = 0;
        Data.prototype.wcId = 0;
        Data.prototype.senderId = 0;
        Data.prototype.members = $util.emptyArray;
        Data.prototype.key = "";
        Data.create = function create(properties) {
            return new Data(properties);
        };
        Data.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.topology != null && message.hasOwnProperty("topology"))
                writer.uint32(8).uint32(message.topology);
            if (message.wcId != null && message.hasOwnProperty("wcId"))
                writer.uint32(16).uint32(message.wcId);
            if (message.senderId != null && message.hasOwnProperty("senderId"))
                writer.uint32(24).uint32(message.senderId);
            if (message.members != null && message.members.length) {
                writer.uint32(34).fork();
                for (var i = 0; i < message.members.length; ++i)
                    writer.uint32(message.members[i]);
                writer.ldelim();
            }
            if (message.key != null && message.hasOwnProperty("key"))
                writer.uint32(42).string(message.key);
            return writer;
        };
        Data.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.channel.Data();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.topology = reader.uint32();
                        break;
                    case 2:
                        message.wcId = reader.uint32();
                        break;
                    case 3:
                        message.senderId = reader.uint32();
                        break;
                    case 4:
                        if (!(message.members && message.members.length))
                            message.members = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.members.push(reader.uint32());
                        }
                        else
                            message.members.push(reader.uint32());
                        break;
                    case 5:
                        message.key = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Data;
    })();
    return channel;
})();
var signaling = $root.signaling = (function () {
    var signaling = {};
    signaling.Message = (function () {
        function Message(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Message.prototype.heartbeat = false;
        Message.prototype.content = null;
        Message.prototype.connect = null;
        Message.prototype.connected = false;
        var $oneOfFields;
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["heartbeat", "content", "connect", "connected"]),
            set: $util.oneOfSetter($oneOfFields)
        });
        Message.create = function create(properties) {
            return new Message(properties);
        };
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.heartbeat != null && message.hasOwnProperty("heartbeat"))
                writer.uint32(8).bool(message.heartbeat);
            if (message.content != null && message.hasOwnProperty("content"))
                $root.signaling.Content.encode(message.content, writer.uint32(18).fork()).ldelim();
            if (message.connect != null && message.hasOwnProperty("connect"))
                $root.signaling.GroupData.encode(message.connect, writer.uint32(26).fork()).ldelim();
            if (message.connected != null && message.hasOwnProperty("connected"))
                writer.uint32(32).bool(message.connected);
            return writer;
        };
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.signaling.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.heartbeat = reader.bool();
                        break;
                    case 2:
                        message.content = $root.signaling.Content.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.connect = $root.signaling.GroupData.decode(reader, reader.uint32());
                        break;
                    case 4:
                        message.connected = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Message;
    })();
    signaling.Content = (function () {
        function Content(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        Content.prototype.senderId = 0;
        Content.prototype.recipientId = 0;
        Content.prototype.lastData = false;
        Content.prototype.data = $util.newBuffer([]);
        Content.create = function create(properties) {
            return new Content(properties);
        };
        Content.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.senderId != null && message.hasOwnProperty("senderId"))
                writer.uint32(8).uint32(message.senderId);
            if (message.recipientId != null && message.hasOwnProperty("recipientId"))
                writer.uint32(16).uint32(message.recipientId);
            if (message.lastData != null && message.hasOwnProperty("lastData"))
                writer.uint32(24).bool(message.lastData);
            if (message.data != null && message.hasOwnProperty("data"))
                writer.uint32(34).bytes(message.data);
            return writer;
        };
        Content.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.signaling.Content();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.senderId = reader.uint32();
                        break;
                    case 2:
                        message.recipientId = reader.uint32();
                        break;
                    case 3:
                        message.lastData = reader.bool();
                        break;
                    case 4:
                        message.data = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return Content;
    })();
    signaling.GroupData = (function () {
        function GroupData(properties) {
            this.members = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }
        GroupData.prototype.id = 0;
        GroupData.prototype.members = $util.emptyArray;
        GroupData.create = function create(properties) {
            return new GroupData(properties);
        };
        GroupData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(8).uint32(message.id);
            if (message.members != null && message.members.length) {
                writer.uint32(18).fork();
                for (var i = 0; i < message.members.length; ++i)
                    writer.uint32(message.members[i]);
                writer.ldelim();
            }
            return writer;
        };
        GroupData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.signaling.GroupData();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
                        if (!(message.members && message.members.length))
                            message.members = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.members.push(reader.uint32());
                        }
                        else
                            message.members.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };
        return GroupData;
    })();
    return signaling;
})();

export default $root;
export { Message, userMessage, channelBuilder, fullMesh, dataChannelBuilder, channel, signaling };
