var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var aspromise = asPromise;

/**
 * Callback as used by {@link util.asPromise}.
 * @typedef asPromiseCallback
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {...*} params Additional arguments
 * @returns {undefined}
 */

/**
 * Returns a promise from a node-style callback function.
 * @memberof util
 * @param {asPromiseCallback} fn Function to call
 * @param {*} ctx Function context
 * @param {...*} params Function arguments
 * @returns {Promise<*>} Promisified function
 */
function asPromise(fn, ctx /*, varargs */) {
    var params = new Array(arguments.length - 1),
        offset = 0,
        index = 2,
        pending = true;
    while (index < arguments.length) {
        params[offset++] = arguments[index++];
    }return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err /*, varargs */) {
            if (pending) {
                pending = false;
                if (err) reject(err);else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length) {
                        params[offset++] = arguments[offset];
                    }resolve.apply(null, params);
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

    /**
     * Calculates the byte length of a base64 encoded string.
     * @param {string} string Base64 encoded string
     * @returns {number} Byte length
     */
    base64.length = function length(string) {
        var p = string.length;
        if (!p) return 0;
        var n = 0;
        while (--p % 4 > 1 && string.charAt(p) === "=") {
            ++n;
        }return Math.ceil(string.length * 3) / 4 - n;
    };

    // Base64 encoding table
    var b64 = new Array(64);

    // Base64 decoding table
    var s64 = new Array(123);

    // 65..90, 97..122, 48..57, 43, 47
    for (var i = 0; i < 64;) {
        s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
    } /**
       * Encodes a buffer to a base64 encoded string.
       * @param {Uint8Array} buffer Source buffer
       * @param {number} start Source start
       * @param {number} end Source end
       * @returns {string} Base64 encoded string
       */
    base64.encode = function encode(buffer, start, end) {
        var parts = null,
            chunk = [];
        var i = 0,
            // output index
        j = 0,
            // goto index
        t; // temporary
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
            if (j === 1) chunk[i++] = 61;
        }
        if (parts) {
            if (i) parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
            return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i));
    };

    var invalidEncoding = "invalid encoding";

    /**
     * Decodes a base64 encoded string to a buffer.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Number of bytes written
     * @throws {Error} If encoding is invalid
     */
    base64.decode = function decode(string, buffer, offset) {
        var start = offset;
        var j = 0,
            // goto index
        t; // temporary
        for (var i = 0; i < string.length;) {
            var c = string.charCodeAt(i++);
            if (c === 61 && j > 1) break;
            if ((c = s64[c]) === undefined) throw Error(invalidEncoding);
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
        if (j === 1) throw Error(invalidEncoding);
        return offset - start;
    };

    /**
     * Tests if the specified string appears to be base64 encoded.
     * @param {string} string String to test
     * @returns {boolean} `true` if probably base64 encoded, otherwise false
     */
    base64.test = function test(string) {
        return (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string)
        );
    };
});

var eventemitter = EventEmitter;

/**
 * Constructs a new event emitter instance.
 * @classdesc A minimal event emitter.
 * @memberof util
 * @constructor
 */
function EventEmitter() {

    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
}

/**
 * Registers an event listener.
 * @param {string} evt Event name
 * @param {function} fn Listener
 * @param {*} [ctx] Listener context
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn: fn,
        ctx: ctx || this
    });
    return this;
};

/**
 * Removes an event listener or any matching listeners if arguments are omitted.
 * @param {string} [evt] Event name. Removes all listeners if omitted.
 * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined) this._listeners = {};else {
        if (fn === undefined) this._listeners[evt] = [];else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;) {
                if (listeners[i].fn === fn) listeners.splice(i, 1);else ++i;
            }
        }
    }
    return this;
};

/**
 * Emits an event by calling its listeners with the specified arguments.
 * @param {string} evt Event name
 * @param {...*} args Arguments
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;) {
            args.push(arguments[i++]);
        }for (i = 0; i < listeners.length;) {
            listeners[i].fn.apply(listeners[i++].ctx, args);
        }
    }
    return this;
};

var float_1 = factory(factory);

/**
 * Reads / writes floats / doubles from / to buffers.
 * @name util.float
 * @namespace
 */

/**
 * Writes a 32 bit float to a buffer using little endian byte order.
 * @name util.float.writeFloatLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 32 bit float to a buffer using big endian byte order.
 * @name util.float.writeFloatBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 32 bit float from a buffer using little endian byte order.
 * @name util.float.readFloatLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 32 bit float from a buffer using big endian byte order.
 * @name util.float.readFloatBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Writes a 64 bit double to a buffer using little endian byte order.
 * @name util.float.writeDoubleLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 64 bit double to a buffer using big endian byte order.
 * @name util.float.writeDoubleBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 64 bit double from a buffer using little endian byte order.
 * @name util.float.readDoubleLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 64 bit double from a buffer using big endian byte order.
 * @name util.float.readDoubleBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

// Factory function for the purpose of node-based testing in modified global environments
function factory(exports) {

    // float: typed array
    if (typeof Float32Array !== "undefined") (function () {

        var f32 = new Float32Array([-0]),
            f8b = new Uint8Array(f32.buffer),
            le = f8b[3] === 128;

        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }

        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        /* istanbul ignore next */
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }

        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }

        /* istanbul ignore next */
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        /* istanbul ignore next */
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

        // float: ieee754
    })();else (function () {

        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign) val = -val;
            if (val === 0) writeUint(1 / val > 0 ? /* positive */0 : /* negative 0 */2147483648, buf, pos);else if (isNaN(val)) writeUint(2143289344, buf, pos);else if (val > 3.4028234663852886e+38) // +-Infinity
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);else if (val < 1.1754943508222875e-38) // denormal
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);else {
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
            return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 // denormal
            ? sign * 1.401298464324817e-45 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }

        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
    })();

    // double: typed array
    if (typeof Float64Array !== "undefined") (function () {

        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le = f8b[7] === 128;

        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos] = f8b[0];
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
            buf[pos] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        /* istanbul ignore next */
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos];
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
            f8b[7] = buf[pos];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }

        /* istanbul ignore next */
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        /* istanbul ignore next */
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

        // double: ieee754
    })();else (function () {

        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign) val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ? /* positive */0 : /* negative 0 */2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) {
                // +-Infinity
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) {
                    // denormal
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024) exponent = 1023;
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
            return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 // denormal
            ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }

        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
    })();

    return exports;
}

// uint helpers

function writeUintLE(val, buf, pos) {
    buf[pos] = val & 255;
    buf[pos + 1] = val >>> 8 & 255;
    buf[pos + 2] = val >>> 16 & 255;
    buf[pos + 3] = val >>> 24;
}

function writeUintBE(val, buf, pos) {
    buf[pos] = val >>> 24;
    buf[pos + 1] = val >>> 16 & 255;
    buf[pos + 2] = val >>> 8 & 255;
    buf[pos + 3] = val & 255;
}

function readUintLE(buf, pos) {
    return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
}

function readUintBE(buf, pos) {
    return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
}

var inquire_1 = inquire;

/**
 * Requires a module only if available.
 * @memberof util
 * @param {string} moduleName Module to require
 * @returns {?Object} Required module if available and not empty, otherwise `null`
 */
function inquire(moduleName) {
    try {
        var mod = undefined; // eslint-disable-line no-eval
        if (mod && (mod.length || Object.keys(mod).length)) return mod;
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}

var utf8_1 = createCommonjsModule(function (module, exports) {
    var utf8 = exports;

    /**
     * Calculates the UTF8 byte length of a string.
     * @param {string} string String
     * @returns {number} Byte length
     */
    utf8.length = function utf8_length(string) {
        var len = 0,
            c = 0;
        for (var i = 0; i < string.length; ++i) {
            c = string.charCodeAt(i);
            if (c < 128) len += 1;else if (c < 2048) len += 2;else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
                ++i;
                len += 4;
            } else len += 3;
        }
        return len;
    };

    /**
     * Reads UTF8 bytes as a string.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} String read
     */
    utf8.read = function utf8_read(buffer, start, end) {
        var len = end - start;
        if (len < 1) return "";
        var parts = null,
            chunk = [],
            i = 0,
            // char offset
        t; // temporary
        while (start < end) {
            t = buffer[start++];
            if (t < 128) chunk[i++] = t;else if (t > 191 && t < 224) chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;else if (t > 239 && t < 365) {
                t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
                chunk[i++] = 0xD800 + (t >> 10);
                chunk[i++] = 0xDC00 + (t & 1023);
            } else chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
            if (i > 8191) {
                (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
                i = 0;
            }
        }
        if (parts) {
            if (i) parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
            return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i));
    };

    /**
     * Writes a string as UTF8 bytes.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */
    utf8.write = function utf8_write(string, buffer, offset) {
        var start = offset,
            c1,
            // character 1
        c2; // character 2
        for (var i = 0; i < string.length; ++i) {
            c1 = string.charCodeAt(i);
            if (c1 < 128) {
                buffer[offset++] = c1;
            } else if (c1 < 2048) {
                buffer[offset++] = c1 >> 6 | 192;
                buffer[offset++] = c1 & 63 | 128;
            } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
                c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
                ++i;
                buffer[offset++] = c1 >> 18 | 240;
                buffer[offset++] = c1 >> 12 & 63 | 128;
                buffer[offset++] = c1 >> 6 & 63 | 128;
                buffer[offset++] = c1 & 63 | 128;
            } else {
                buffer[offset++] = c1 >> 12 | 224;
                buffer[offset++] = c1 >> 6 & 63 | 128;
                buffer[offset++] = c1 & 63 | 128;
            }
        }
        return offset - start;
    };
});

var pool_1 = pool;

/**
 * An allocator as used by {@link util.pool}.
 * @typedef PoolAllocator
 * @type {function}
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

/**
 * A slicer as used by {@link util.pool}.
 * @typedef PoolSlicer
 * @type {function}
 * @param {number} start Start offset
 * @param {number} end End offset
 * @returns {Uint8Array} Buffer slice
 * @this {Uint8Array}
 */

/**
 * A general purpose buffer pool.
 * @memberof util
 * @function
 * @param {PoolAllocator} alloc Allocator
 * @param {PoolSlicer} slice Slicer
 * @param {number} [size=8192] Slab size
 * @returns {PoolAllocator} Pooled allocator
 */
function pool(alloc, slice, size) {
    var SIZE = size || 8192;
    var MAX = SIZE >>> 1;
    var slab = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX) return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf;
    };
}

var longbits = LongBits$1;

/**
 * Constructs new long bits.
 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
 * @memberof util
 * @constructor
 * @param {number} lo Low 32 bits, unsigned
 * @param {number} hi High 32 bits, unsigned
 */
function LongBits$1(lo, hi) {

    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;

    /**
     * High bits.
     * @type {number}
     */
    this.hi = hi >>> 0;
}

/**
 * Zero bits.
 * @memberof util.LongBits
 * @type {util.LongBits}
 */
var zero = LongBits$1.zero = new LongBits$1(0, 0);

zero.toNumber = function () {
    return 0;
};
zero.zzEncode = zero.zzDecode = function () {
    return this;
};
zero.length = function () {
    return 1;
};

/**
 * Zero hash.
 * @memberof util.LongBits
 * @type {string}
 */
var zeroHash = LongBits$1.zeroHash = "\0\0\0\0\0\0\0\0";

/**
 * Constructs new long bits from the specified number.
 * @param {number} value Value
 * @returns {util.LongBits} Instance
 */
LongBits$1.fromNumber = function fromNumber(value) {
    if (value === 0) return zero;
    var sign = value < 0;
    if (sign) value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295) hi = 0;
        }
    }
    return new LongBits$1(lo, hi);
};

/**
 * Constructs new long bits from a number, long or string.
 * @param {Long|number|string} value Value
 * @returns {util.LongBits} Instance
 */
LongBits$1.from = function from(value) {
    if (typeof value === "number") return LongBits$1.fromNumber(value);
    if (minimal$2.isString(value)) {
        /* istanbul ignore else */
        if (minimal$2.Long) value = minimal$2.Long.fromString(value);else return LongBits$1.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits$1(value.low >>> 0, value.high >>> 0) : zero;
};

/**
 * Converts this long bits to a possibly unsafe JavaScript number.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {number} Possibly unsafe number
 */
LongBits$1.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi >>> 0;
        if (!lo) hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};

/**
 * Converts this long bits to a long.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long} Long
 */
LongBits$1.prototype.toLong = function toLong(unsigned) {
    return minimal$2.Long ? new minimal$2.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
    /* istanbul ignore next */
    : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};

var charCodeAt = String.prototype.charCodeAt;

/**
 * Constructs new long bits from the specified 8 characters long hash.
 * @param {string} hash Hash
 * @returns {util.LongBits} Bits
 */
LongBits$1.fromHash = function fromHash(hash) {
    if (hash === zeroHash) return zero;
    return new LongBits$1((charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0, (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0);
};

/**
 * Converts this long bits to a 8 characters long hash.
 * @returns {string} Hash
 */
LongBits$1.prototype.toHash = function toHash() {
    return String.fromCharCode(this.lo & 255, this.lo >>> 8 & 255, this.lo >>> 16 & 255, this.lo >>> 24, this.hi & 255, this.hi >>> 8 & 255, this.hi >>> 16 & 255, this.hi >>> 24);
};

/**
 * Zig-zag encodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits$1.prototype.zzEncode = function zzEncode() {
    var mask = this.hi >> 31;
    this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo = (this.lo << 1 ^ mask) >>> 0;
    return this;
};

/**
 * Zig-zag decodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits$1.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi = (this.hi >>> 1 ^ mask) >>> 0;
    return this;
};

/**
 * Calculates the length of this longbits when encoded as a varint.
 * @returns {number} Length
 */
LongBits$1.prototype.length = function length() {
    var part0 = this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 = this.hi >>> 24;
    return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var minimal$2 = createCommonjsModule(function (module, exports) {
    var util = exports;

    // used to return a Promise where callback is omitted
    util.asPromise = aspromise;

    // converts to / from base64 encoded strings
    util.base64 = base64_1;

    // base class of rpc.Service
    util.EventEmitter = eventemitter;

    // float handling accross browsers
    util.float = float_1;

    // requires modules optionally and hides the call from bundlers
    util.inquire = inquire_1;

    // converts to / from utf8 encoded strings
    util.utf8 = utf8_1;

    // provides a node-like buffer pool in the browser
    util.pool = pool_1;

    // utility to work with the low and high bits of a 64 bit value
    util.LongBits = longbits;

    /**
     * An immuable empty array.
     * @memberof util
     * @type {Array.<*>}
     * @const
     */
    util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */[]; // used on prototypes

    /**
     * An immutable empty object.
     * @type {Object}
     * @const
     */
    util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */{}; // used on prototypes

    /**
     * Whether running within node or not.
     * @memberof util
     * @type {boolean}
     * @const
     */
    util.isNode = Boolean(commonjsGlobal.process && commonjsGlobal.process.versions && commonjsGlobal.process.versions.node);

    /**
     * Tests if the specified value is an integer.
     * @function
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is an integer
     */
    util.isInteger = Number.isInteger || /* istanbul ignore next */function isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };

    /**
     * Tests if the specified value is a string.
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is a string
     */
    util.isString = function isString(value) {
        return typeof value === "string" || value instanceof String;
    };

    /**
     * Tests if the specified value is a non-null object.
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is a non-null object
     */
    util.isObject = function isObject(value) {
        return value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === "object";
    };

    /**
     * Checks if a property on a message is considered to be present.
     * This is an alias of {@link util.isSet}.
     * @function
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isset =

    /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isSet = function isSet(obj, prop) {
        var value = obj[prop];
        if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
            return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
        return false;
    };

    /**
     * Any compatible Buffer instance.
     * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
     * @interface Buffer
     * @extends Uint8Array
     */

    /**
     * Node's Buffer class if available.
     * @type {Constructor<Buffer>}
     */
    util.Buffer = function () {
        try {
            var Buffer = util.inquire("buffer").Buffer;
            // refuse to use non-node buffers if not explicitly assigned (perf reasons):
            return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */null;
        } catch (e) {
            /* istanbul ignore next */
            return null;
        }
    }();

    // Internal alias of or polyfull for Buffer.from.
    util._Buffer_from = null;

    // Internal alias of or polyfill for Buffer.allocUnsafe.
    util._Buffer_allocUnsafe = null;

    /**
     * Creates a new buffer of whatever type supported by the environment.
     * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
     * @returns {Uint8Array|Buffer} Buffer
     */
    util.newBuffer = function newBuffer(sizeOrArray) {
        /* istanbul ignore next */
        return typeof sizeOrArray === "number" ? util.Buffer ? util._Buffer_allocUnsafe(sizeOrArray) : new util.Array(sizeOrArray) : util.Buffer ? util._Buffer_from(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
    };

    /**
     * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
     * @type {Constructor<Uint8Array>}
     */
    util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

    /**
     * Any compatible Long instance.
     * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
     * @interface Long
     * @property {number} low Low bits
     * @property {number} high High bits
     * @property {boolean} unsigned Whether unsigned or not
     */

    /**
     * Long.js's Long class if available.
     * @type {Constructor<Long>}
     */
    util.Long = /* istanbul ignore next */commonjsGlobal.dcodeIO && /* istanbul ignore next */commonjsGlobal.dcodeIO.Long || util.inquire("long");

    /**
     * Regular expression used to verify 2 bit (`bool`) map keys.
     * @type {RegExp}
     * @const
     */
    util.key2Re = /^true|false|0|1$/;

    /**
     * Regular expression used to verify 32 bit (`int32` etc.) map keys.
     * @type {RegExp}
     * @const
     */
    util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

    /**
     * Regular expression used to verify 64 bit (`int64` etc.) map keys.
     * @type {RegExp}
     * @const
     */
    util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

    /**
     * Converts a number or long to an 8 characters long hash string.
     * @param {Long|number} value Value to convert
     * @returns {string} Hash
     */
    util.longToHash = function longToHash(value) {
        return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
    };

    /**
     * Converts an 8 characters long hash string to a long or number.
     * @param {string} hash Hash
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {Long|number} Original value
     */
    util.longFromHash = function longFromHash(hash, unsigned) {
        var bits = util.LongBits.fromHash(hash);
        if (util.Long) return util.Long.fromBits(bits.lo, bits.hi, unsigned);
        return bits.toNumber(Boolean(unsigned));
    };

    /**
     * Merges the properties of the source object into the destination object.
     * @memberof util
     * @param {Object.<string,*>} dst Destination object
     * @param {Object.<string,*>} src Source object
     * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
     * @returns {Object.<string,*>} Destination object
     */
    function merge(dst, src, ifNotSet) {
        // used by converters
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i) {
            if (dst[keys[i]] === undefined || !ifNotSet) dst[keys[i]] = src[keys[i]];
        }return dst;
    }

    util.merge = merge;

    /**
     * Converts the first character of a string to lower case.
     * @param {string} str String to convert
     * @returns {string} Converted string
     */
    util.lcFirst = function lcFirst(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
    };

    /**
     * Creates a custom error constructor.
     * @memberof util
     * @param {string} name Error name
     * @returns {Constructor<Error>} Custom error constructor
     */
    function newError(name) {

        function CustomError(message, properties) {

            if (!(this instanceof CustomError)) return new CustomError(message, properties);

            // Error.call(this, message);
            // ^ just returns a new error instance because the ctor can be called as a function

            Object.defineProperty(this, "message", { get: function get() {
                    return message;
                } });

            /* istanbul ignore next */
            if (Error.captureStackTrace) // node
                Error.captureStackTrace(this, CustomError);else Object.defineProperty(this, "stack", { value: new Error().stack || "" });

            if (properties) merge(this, properties);
        }

        (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

        Object.defineProperty(CustomError.prototype, "name", { get: function get() {
                return name;
            } });

        CustomError.prototype.toString = function toString() {
            return this.name + ": " + this.message;
        };

        return CustomError;
    }

    util.newError = newError;

    /**
     * Constructs a new protocol error.
     * @classdesc Error subclass indicating a protocol specifc error.
     * @memberof util
     * @extends Error
     * @template T extends Message<T>
     * @constructor
     * @param {string} message Error message
     * @param {Object.<string,*>} [properties] Additional properties
     * @example
     * try {
     *     MyMessage.decode(someBuffer); // throws if required fields are missing
     * } catch (e) {
     *     if (e instanceof ProtocolError && e.instance)
     *         console.log("decoded so far: " + JSON.stringify(e.instance));
     * }
     */
    util.ProtocolError = newError("ProtocolError");

    /**
     * So far decoded message instance.
     * @name util.ProtocolError#instance
     * @type {Message<T>}
     */

    /**
     * A OneOf getter as returned by {@link util.oneOfGetter}.
     * @typedef OneOfGetter
     * @type {function}
     * @returns {string|undefined} Set field name, if any
     */

    /**
     * Builds a getter for a oneof's present field name.
     * @param {string[]} fieldNames Field names
     * @returns {OneOfGetter} Unbound getter
     */
    util.oneOfGetter = function getOneOf(fieldNames) {
        var fieldMap = {};
        for (var i = 0; i < fieldNames.length; ++i) {
            fieldMap[fieldNames[i]] = 1;
        } /**
           * @returns {string|undefined} Set field name, if any
           * @this Object
           * @ignore
           */
        return function () {
            // eslint-disable-line consistent-return
            for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i) {
                if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null) return keys[i];
            }
        };
    };

    /**
     * A OneOf setter as returned by {@link util.oneOfSetter}.
     * @typedef OneOfSetter
     * @type {function}
     * @param {string|undefined} value Field name
     * @returns {undefined}
     */

    /**
     * Builds a setter for a oneof's present field name.
     * @param {string[]} fieldNames Field names
     * @returns {OneOfSetter} Unbound setter
     */
    util.oneOfSetter = function setOneOf(fieldNames) {

        /**
         * @param {string} name Field name
         * @returns {undefined}
         * @this Object
         * @ignore
         */
        return function (name) {
            for (var i = 0; i < fieldNames.length; ++i) {
                if (fieldNames[i] !== name) delete this[fieldNames[i]];
            }
        };
    };

    /**
     * Default conversion options used for {@link Message#toJSON} implementations.
     *
     * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
     *
     * - Longs become strings
     * - Enums become string keys
     * - Bytes become base64 encoded strings
     * - (Sub-)Messages become plain objects
     * - Maps become plain objects with all string keys
     * - Repeated fields become arrays
     * - NaN and Infinity for float and double fields become strings
     *
     * @type {IConversionOptions}
     * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
     */
    util.toJSONOptions = {
        longs: String,
        enums: String,
        bytes: String,
        json: true
    };

    util._configure = function () {
        var Buffer = util.Buffer;
        /* istanbul ignore if */
        if (!Buffer) {
            util._Buffer_from = util._Buffer_allocUnsafe = null;
            return;
        }
        // because node 4.x buffers are incompatible & immutable
        // see: https://github.com/dcodeIO/protobuf.js/pull/665
        util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        /* istanbul ignore next */
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
        util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
    };
});

var writer = Writer;

var BufferWriter; // cyclic

var LongBits = minimal$2.LongBits;
var base64 = minimal$2.base64;
var utf8 = minimal$2.utf8;

/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */
function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

/* istanbul ignore next */
function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */
function Writer() {

    /**
     * Current length.
     * @type {number}
     */
    this.len = 0;

    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);

    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;

    // When a value is written, the writer calculates its byte length and puts it into a linked
    // list of operations to perform when finish() is called. This both allows us to allocate
    // buffers of the exact required size and reduces the amount of work we have to do compared
    // to first calculating over objects and then encoding over objects. In our case, the encoding
    // part is just a linked list walk calling operations with already prepared values.
}

/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */
Writer.create = minimal$2.Buffer ? function create_buffer_setup() {
    return (Writer.create = function create_buffer() {
        return new BufferWriter();
    })();
}
/* istanbul ignore next */
: function create_array() {
    return new Writer();
};

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new minimal$2.Array(size);
};

// Use Uint8Array buffer pool in the browser, just like node does with buffers
/* istanbul ignore else */
if (minimal$2.Array !== Array) Writer.alloc = minimal$2.pool(Writer.alloc, minimal$2.Array.prototype.subarray);

/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */
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

/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;

/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.uint32 = function write_uint32(value) {
    // here, the call to this.push has been inlined and a varint specific Op subclass is used.
    // uint32 is by far the most frequently used operation and benefits significantly from this.
    this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
    return this;
};

/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.int32 = function write_int32(value) {
    return value < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
    : this.uint32(value);
};

/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
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

/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.int64 = Writer.prototype.uint64;

/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
    buf[pos] = val & 255;
    buf[pos + 1] = val >>> 8 & 255;
    buf[pos + 2] = val >>> 16 & 255;
    buf[pos + 3] = val >>> 24;
}

/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};

/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sfixed32 = Writer.prototype.fixed32;

/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};

/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sfixed64 = Writer.prototype.fixed64;

/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.float = function write_float(value) {
    return this._push(minimal$2.float.writeFloatLE, 4, value);
};

/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.double = function write_double(value) {
    return this._push(minimal$2.float.writeDoubleLE, 8, value);
};

var writeBytes = minimal$2.Array.prototype.set ? function writeBytes_set(val, buf, pos) {
    buf.set(val, pos); // also works for plain array values
}
/* istanbul ignore next */
: function writeBytes_for(val, buf, pos) {
    for (var i = 0; i < val.length; ++i) {
        buf[pos + i] = val[i];
    }
};

/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len) return this._push(writeByte, 1, 0);
    if (minimal$2.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};

/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len ? this.uint32(len)._push(utf8.write, len, value) : this._push(writeByte, 1, 0);
};

/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};

/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head = this.states.head;
        this.tail = this.states.tail;
        this.len = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish() {
    var head = this.head.next,
        // skip noop
    buf = this.constructor.alloc(this.len),
        pos = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    // this.head = this.tail = null;
    return buf;
};

Writer._configure = function (BufferWriter_) {
    BufferWriter = BufferWriter_;
};

var writer_buffer = BufferWriter$1;

// extends Writer

(BufferWriter$1.prototype = Object.create(writer.prototype)).constructor = BufferWriter$1;

var Buffer = minimal$2.Buffer;

/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */
function BufferWriter$1() {
    writer.call(this);
}

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Buffer} Buffer
 */
BufferWriter$1.alloc = function alloc_buffer(size) {
    return (BufferWriter$1.alloc = minimal$2._Buffer_allocUnsafe)(size);
};

var writeBytesBuffer = Buffer && Buffer.prototype instanceof Uint8Array && Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
    buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
    // also works for plain array values
}
/* istanbul ignore next */
: function writeBytesBuffer_copy(val, buf, pos) {
    if (val.copy) // Buffer values
        val.copy(buf, pos, 0, val.length);else for (var i = 0; i < val.length;) {
        // plain array values
        buf[pos++] = val[i++];
    }
};

/**
 * @override
 */
BufferWriter$1.prototype.bytes = function write_bytes_buffer(value) {
    if (minimal$2.isString(value)) value = minimal$2._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len) this._push(writeBytesBuffer, len, value);
    return this;
};

function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
        minimal$2.utf8.write(val, buf, pos);else buf.utf8Write(val, pos);
}

/**
 * @override
 */
BufferWriter$1.prototype.string = function write_string_buffer(value) {
    var len = Buffer.byteLength(value);
    this.uint32(len);
    if (len) this._push(writeStringBuffer, len, value);
    return this;
};

var reader = Reader;

var BufferReader; // cyclic

var LongBits$2 = minimal$2.LongBits;
var utf8$1 = minimal$2.utf8;

/* istanbul ignore next */
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */
function Reader(buffer) {

    /**
     * Read buffer.
     * @type {Uint8Array}
     */
    this.buf = buffer;

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined" ? function create_typed_array(buffer) {
    if (buffer instanceof Uint8Array || Array.isArray(buffer)) return new Reader(buffer);
    throw Error("illegal buffer");
}
/* istanbul ignore next */
: function create_array(buffer) {
    if (Array.isArray(buffer)) return new Reader(buffer);
    throw Error("illegal buffer");
};

/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */
Reader.create = minimal$2.Buffer ? function create_buffer_setup(buffer) {
    return (Reader.create = function create_buffer(buffer) {
        return minimal$2.Buffer.isBuffer(buffer) ? new BufferReader(buffer)
        /* istanbul ignore next */
        : create_array(buffer);
    })(buffer);
}
/* istanbul ignore next */
: create_array;

Reader.prototype._slice = minimal$2.Array.prototype.subarray || /* istanbul ignore next */minimal$2.Array.prototype.slice;

/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.uint32 = function read_uint32_setup() {
    var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
    return function read_uint32() {
        value = (this.buf[this.pos] & 127) >>> 0;if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;if (this.buf[this.pos++] < 128) return value;

        /* istanbul ignore if */
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
}();

/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};

/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};

/* eslint-disable no-invalid-this */

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    var bits = new LongBits$2(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) {
        // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128) return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
        if (this.buf[this.pos++] < 128) return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len) throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128) return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) {
        // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128) return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len) throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128) return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};

function readFixed32_end(buf, end) {
    // note that this uses `end`, not `pos`
    return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
}

/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.fixed32 = function read_fixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4);
};

/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.sfixed32 = function read_sfixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4) | 0;
};

/* eslint-disable no-invalid-this */

function readFixed64() /* this: Reader */{

    /* istanbul ignore if */
    if (this.pos + 8 > this.len) throw indexOutOfRange(this, 8);

    return new LongBits$2(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}

/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.float = function read_float() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);

    var value = minimal$2.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.double = function read_double() {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len) throw indexOutOfRange(this, 4);

    var value = minimal$2.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start = this.pos,
        end = this.pos + length;

    /* istanbul ignore if */
    if (end > this.len) throw indexOutOfRange(this, length);

    this.pos += length;
    if (Array.isArray(this.buf)) // plain array
        return this.buf.slice(start, end);
    return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
    ? new this.buf.constructor(0) : this._slice.call(this.buf, start, end);
};

/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8$1.read(bytes, 0, bytes.length);
};

/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        /* istanbul ignore if */
        if (this.pos + length > this.len) throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            /* istanbul ignore if */
            if (this.pos >= this.len) throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};

/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */
Reader.prototype.skipType = function (wireType) {
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
            do {
                // eslint-disable-line no-constant-condition
                if ((wireType = this.uint32() & 7) === 4) break;
                this.skipType(wireType);
            } while (true);
            break;
        case 5:
            this.skip(4);
            break;

        /* istanbul ignore next */
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};

Reader._configure = function (BufferReader_) {
    BufferReader = BufferReader_;

    var fn = minimal$2.Long ? "toLong" : /* istanbul ignore next */"toNumber";
    minimal$2.merge(Reader.prototype, {

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

// extends Reader

(BufferReader$1.prototype = Object.create(reader.prototype)).constructor = BufferReader$1;

/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */
function BufferReader$1(buffer) {
  reader.call(this, buffer);

  /**
   * Read buffer.
   * @name BufferReader#buf
   * @type {Buffer}
   */
}

/* istanbul ignore else */
if (minimal$2.Buffer) BufferReader$1.prototype._slice = minimal$2.Buffer.prototype.slice;

/**
 * @override
 */
BufferReader$1.prototype.string = function read_string_buffer() {
  var len = this.uint32(); // modifies pos
  return this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len));
};

var service$1 = Service;

// Extends EventEmitter
(Service.prototype = Object.create(minimal$2.EventEmitter.prototype)).constructor = Service;

/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */
function Service(rpcImpl, requestDelimited, responseDelimited) {

    if (typeof rpcImpl !== "function") throw TypeError("rpcImpl must be a function");

    minimal$2.EventEmitter.call(this);

    /**
     * RPC implementation. Becomes `null` once the service is ended.
     * @type {RPCImpl|null}
     */
    this.rpcImpl = rpcImpl;

    /**
     * Whether requests are length-delimited.
     * @type {boolean}
     */
    this.requestDelimited = Boolean(requestDelimited);

    /**
     * Whether responses are length-delimited.
     * @type {boolean}
     */
    this.responseDelimited = Boolean(responseDelimited);
}

/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

    if (!request) throw TypeError("request must be specified");

    var self = this;
    if (!callback) return minimal$2.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

    if (!self.rpcImpl) {
        setTimeout(function () {
            callback(Error("already ended"));
        }, 0);
        return undefined;
    }

    try {
        return self.rpcImpl(method, requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(), function rpcCallback(err, response) {

            if (err) {
                self.emit("error", err, method);
                return callback(err);
            }

            if (response === null) {
                self.end( /* endedByRPC */true);
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
        });
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function () {
            callback(err);
        }, 0);
        return undefined;
    }
};

/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC) // signal end to rpcImpl
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};

var rpc_1 = createCommonjsModule(function (module, exports) {
  var rpc = exports;

  /**
   * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
   * @typedef RPCImpl
   * @type {function}
   * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
   * @param {Uint8Array} requestData Request data
   * @param {RPCImplCallback} callback Callback function
   * @returns {undefined}
   * @example
   * function rpcImpl(method, requestData, callback) {
   *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
   *         throw Error("no such method");
   *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
   *         callback(err, responseData);
   *     });
   * }
   */

  /**
   * Node-style callback as used by {@link RPCImpl}.
   * @typedef RPCImplCallback
   * @type {function}
   * @param {Error|null} error Error, if any, otherwise `null`
   * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
   * @returns {undefined}
   */

  rpc.Service = service$1;
});

var roots = {};

var indexMinimal = createCommonjsModule(function (module, exports) {
  var protobuf = exports;

  /**
   * Build type, one of `"full"`, `"light"` or `"minimal"`.
   * @name build
   * @type {string}
   * @const
   */
  protobuf.build = "minimal";

  // Serialization
  protobuf.Writer = writer;
  protobuf.BufferWriter = writer_buffer;
  protobuf.Reader = reader;
  protobuf.BufferReader = reader_buffer;

  // Utility
  protobuf.util = minimal$2;
  protobuf.rpc = rpc_1;
  protobuf.roots = roots;
  protobuf.configure = configure;

  /* istanbul ignore next */
  /**
   * Reconfigures the library according to the environment.
   * @returns {undefined}
   */
  function configure() {
    protobuf.Reader._configure(protobuf.BufferReader);
    protobuf.util._configure();
  }

  // Configure serialization
  protobuf.Writer._configure(protobuf.BufferWriter);
  configure();
});

var minimal = indexMinimal;

var minimal_1 = minimal.Reader;
var minimal_2 = minimal.Writer;
var minimal_3 = minimal.util;
var minimal_4 = minimal.roots;

/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
// Common aliases
var $Reader = minimal_1;
var $Writer = minimal_2;
var $util = minimal_3;

// Exported root namespace
var $root = minimal_4["default"] || (minimal_4["default"] = {});

var Message = $root.Message = function () {

    /**
     * Properties of a Message.
     * @exports IMessage
     * @interface IMessage
     * @property {number|null} [senderId] Message senderId
     * @property {number|null} [recipientId] Message recipientId
     * @property {boolean|null} [isService] Message isService
     * @property {Uint8Array|null} [content] Message content
     */

    /**
     * Constructs a new Message.
     * @exports Message
     * @classdesc Represents a Message.
     * @implements IMessage
     * @constructor
     * @param {IMessage=} [properties] Properties to set
     */
    function Message(properties) {
        if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
        }
    }

    /**
     * Message senderId.
     * @member {number} senderId
     * @memberof Message
     * @instance
     */
    Message.prototype.senderId = 0;

    /**
     * Message recipientId.
     * @member {number} recipientId
     * @memberof Message
     * @instance
     */
    Message.prototype.recipientId = 0;

    /**
     * Message isService.
     * @member {boolean} isService
     * @memberof Message
     * @instance
     */
    Message.prototype.isService = false;

    /**
     * Message content.
     * @member {Uint8Array} content
     * @memberof Message
     * @instance
     */
    Message.prototype.content = $util.newBuffer([]);

    /**
     * Creates a new Message instance using the specified properties.
     * @function create
     * @memberof Message
     * @static
     * @param {IMessage=} [properties] Properties to set
     * @returns {Message} Message instance
     */
    Message.create = function create(properties) {
        return new Message(properties);
    };

    /**
     * Encodes the specified Message message. Does not implicitly {@link Message.verify|verify} messages.
     * @function encode
     * @memberof Message
     * @static
     * @param {IMessage} message Message message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Message.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.senderId != null && message.hasOwnProperty("senderId")) writer.uint32( /* id 1, wireType 0 =*/8).uint32(message.senderId);
        if (message.recipientId != null && message.hasOwnProperty("recipientId")) writer.uint32( /* id 2, wireType 0 =*/16).uint32(message.recipientId);
        if (message.isService != null && message.hasOwnProperty("isService")) writer.uint32( /* id 3, wireType 0 =*/24).bool(message.isService);
        if (message.content != null && message.hasOwnProperty("content")) writer.uint32( /* id 4, wireType 2 =*/34).bytes(message.content);
        return writer;
    };

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @function decode
     * @memberof Message
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Message} Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Message.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.Message();
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
                    message.isService = reader.bool();
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
}();

var user = $root.user = function () {

    /**
     * Namespace user.
     * @exports user
     * @namespace
     */
    var user = {};

    user.Message = function () {

        /**
         * Properties of a Message.
         * @memberof user
         * @interface IMessage
         * @property {number|null} [length] Message length
         * @property {user.Message.Type|null} [type] Message type
         * @property {Uint8Array|null} [full] Message full
         * @property {user.Message.IChunk|null} [chunk] Message chunk
         */

        /**
         * Constructs a new Message.
         * @memberof user
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {user.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message length.
         * @member {number} length
         * @memberof user.Message
         * @instance
         */
        Message.prototype.length = 0;

        /**
         * Message type.
         * @member {user.Message.Type} type
         * @memberof user.Message
         * @instance
         */
        Message.prototype.type = 0;

        /**
         * Message full.
         * @member {Uint8Array} full
         * @memberof user.Message
         * @instance
         */
        Message.prototype.full = $util.newBuffer([]);

        /**
         * Message chunk.
         * @member {user.Message.IChunk|null|undefined} chunk
         * @memberof user.Message
         * @instance
         */
        Message.prototype.chunk = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Message content.
         * @member {"full"|"chunk"|undefined} content
         * @memberof user.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "content", {
            get: $util.oneOfGetter($oneOfFields = ["full", "chunk"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof user.Message
         * @static
         * @param {user.IMessage=} [properties] Properties to set
         * @returns {user.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link user.Message.verify|verify} messages.
         * @function encode
         * @memberof user.Message
         * @static
         * @param {user.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.length != null && message.hasOwnProperty("length")) writer.uint32( /* id 1, wireType 0 =*/8).uint32(message.length);
            if (message.type != null && message.hasOwnProperty("type")) writer.uint32( /* id 2, wireType 0 =*/16).int32(message.type);
            if (message.full != null && message.hasOwnProperty("full")) writer.uint32( /* id 3, wireType 2 =*/26).bytes(message.full);
            if (message.chunk != null && message.hasOwnProperty("chunk")) $root.user.Message.Chunk.encode(message.chunk, writer.uint32( /* id 4, wireType 2 =*/34).fork()).ldelim();
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof user.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {user.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.user.Message();
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
                        message.chunk = $root.user.Message.Chunk.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        Message.Chunk = function () {

            /**
             * Properties of a Chunk.
             * @memberof user.Message
             * @interface IChunk
             * @property {number|null} [id] Chunk id
             * @property {number|null} [number] Chunk number
             * @property {Uint8Array|null} [content] Chunk content
             */

            /**
             * Constructs a new Chunk.
             * @memberof user.Message
             * @classdesc Represents a Chunk.
             * @implements IChunk
             * @constructor
             * @param {user.Message.IChunk=} [properties] Properties to set
             */
            function Chunk(properties) {
                if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                    if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
                }
            }

            /**
             * Chunk id.
             * @member {number} id
             * @memberof user.Message.Chunk
             * @instance
             */
            Chunk.prototype.id = 0;

            /**
             * Chunk number.
             * @member {number} number
             * @memberof user.Message.Chunk
             * @instance
             */
            Chunk.prototype.number = 0;

            /**
             * Chunk content.
             * @member {Uint8Array} content
             * @memberof user.Message.Chunk
             * @instance
             */
            Chunk.prototype.content = $util.newBuffer([]);

            /**
             * Creates a new Chunk instance using the specified properties.
             * @function create
             * @memberof user.Message.Chunk
             * @static
             * @param {user.Message.IChunk=} [properties] Properties to set
             * @returns {user.Message.Chunk} Chunk instance
             */
            Chunk.create = function create(properties) {
                return new Chunk(properties);
            };

            /**
             * Encodes the specified Chunk message. Does not implicitly {@link user.Message.Chunk.verify|verify} messages.
             * @function encode
             * @memberof user.Message.Chunk
             * @static
             * @param {user.Message.IChunk} message Chunk message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Chunk.encode = function encode(message, writer) {
                if (!writer) writer = $Writer.create();
                if (message.id != null && message.hasOwnProperty("id")) writer.uint32( /* id 1, wireType 0 =*/8).uint32(message.id);
                if (message.number != null && message.hasOwnProperty("number")) writer.uint32( /* id 2, wireType 0 =*/16).uint32(message.number);
                if (message.content != null && message.hasOwnProperty("content")) writer.uint32( /* id 4, wireType 2 =*/34).bytes(message.content);
                return writer;
            };

            /**
             * Decodes a Chunk message from the specified reader or buffer.
             * @function decode
             * @memberof user.Message.Chunk
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {user.Message.Chunk} Chunk
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Chunk.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length,
                    message = new $root.user.Message.Chunk();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            message.id = reader.uint32();
                            break;
                        case 2:
                            message.number = reader.uint32();
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
        }();

        /**
         * Type enum.
         * @name user.Message.Type
         * @enum {string}
         * @property {number} STRING=0 STRING value
         * @property {number} U_INT_8_ARRAY=1 U_INT_8_ARRAY value
         */
        Message.Type = function () {
            var valuesById = {},
                values = Object.create(valuesById);
            values[valuesById[0] = "STRING"] = 0;
            values[valuesById[1] = "U_INT_8_ARRAY"] = 1;
            return values;
        }();

        return Message;
    }();

    return user;
}();

var service = $root.service = function () {

    /**
     * Namespace service.
     * @exports service
     * @namespace
     */
    var service = {};

    service.Message = function () {

        /**
         * Properties of a Message.
         * @memberof service
         * @interface IMessage
         * @property {number|null} [id] Message id
         * @property {Uint8Array|null} [content] Message content
         */

        /**
         * Constructs a new Message.
         * @memberof service
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {service.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message id.
         * @member {number} id
         * @memberof service.Message
         * @instance
         */
        Message.prototype.id = 0;

        /**
         * Message content.
         * @member {Uint8Array} content
         * @memberof service.Message
         * @instance
         */
        Message.prototype.content = $util.newBuffer([]);

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof service.Message
         * @static
         * @param {service.IMessage=} [properties] Properties to set
         * @returns {service.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link service.Message.verify|verify} messages.
         * @function encode
         * @memberof service.Message
         * @static
         * @param {service.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id")) writer.uint32( /* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.content != null && message.hasOwnProperty("content")) writer.uint32( /* id 2, wireType 2 =*/18).bytes(message.content);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof service.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {service.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.service.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
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
    }();

    return service;
}();

var webChannel = $root.webChannel = function () {

    /**
     * Namespace webChannel.
     * @exports webChannel
     * @namespace
     */
    var webChannel = {};

    webChannel.Message = function () {

        /**
         * Properties of a Message.
         * @memberof webChannel
         * @interface IMessage
         * @property {webChannel.IInitData|null} [init] Message init
         * @property {webChannel.IPeers|null} [initOk] Message initOk
         * @property {boolean|null} [ping] Message ping
         * @property {boolean|null} [pong] Message pong
         */

        /**
         * Constructs a new Message.
         * @memberof webChannel
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {webChannel.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message init.
         * @member {webChannel.IInitData|null|undefined} init
         * @memberof webChannel.Message
         * @instance
         */
        Message.prototype.init = null;

        /**
         * Message initOk.
         * @member {webChannel.IPeers|null|undefined} initOk
         * @memberof webChannel.Message
         * @instance
         */
        Message.prototype.initOk = null;

        /**
         * Message ping.
         * @member {boolean} ping
         * @memberof webChannel.Message
         * @instance
         */
        Message.prototype.ping = false;

        /**
         * Message pong.
         * @member {boolean} pong
         * @memberof webChannel.Message
         * @instance
         */
        Message.prototype.pong = false;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Message type.
         * @member {"init"|"initOk"|"ping"|"pong"|undefined} type
         * @memberof webChannel.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["init", "initOk", "ping", "pong"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof webChannel.Message
         * @static
         * @param {webChannel.IMessage=} [properties] Properties to set
         * @returns {webChannel.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link webChannel.Message.verify|verify} messages.
         * @function encode
         * @memberof webChannel.Message
         * @static
         * @param {webChannel.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.init != null && message.hasOwnProperty("init")) $root.webChannel.InitData.encode(message.init, writer.uint32( /* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.initOk != null && message.hasOwnProperty("initOk")) $root.webChannel.Peers.encode(message.initOk, writer.uint32( /* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.ping != null && message.hasOwnProperty("ping")) writer.uint32( /* id 3, wireType 0 =*/24).bool(message.ping);
            if (message.pong != null && message.hasOwnProperty("pong")) writer.uint32( /* id 4, wireType 0 =*/32).bool(message.pong);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof webChannel.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {webChannel.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webChannel.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.init = $root.webChannel.InitData.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.initOk = $root.webChannel.Peers.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.ping = reader.bool();
                        break;
                    case 4:
                        message.pong = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    webChannel.InitData = function () {

        /**
         * Properties of an InitData.
         * @memberof webChannel
         * @interface IInitData
         * @property {number|null} [topology] InitData topology
         * @property {number|null} [wcId] InitData wcId
         * @property {Array.<number>|null} [generatedIds] InitData generatedIds
         */

        /**
         * Constructs a new InitData.
         * @memberof webChannel
         * @classdesc Represents an InitData.
         * @implements IInitData
         * @constructor
         * @param {webChannel.IInitData=} [properties] Properties to set
         */
        function InitData(properties) {
            this.generatedIds = [];
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * InitData topology.
         * @member {number} topology
         * @memberof webChannel.InitData
         * @instance
         */
        InitData.prototype.topology = 0;

        /**
         * InitData wcId.
         * @member {number} wcId
         * @memberof webChannel.InitData
         * @instance
         */
        InitData.prototype.wcId = 0;

        /**
         * InitData generatedIds.
         * @member {Array.<number>} generatedIds
         * @memberof webChannel.InitData
         * @instance
         */
        InitData.prototype.generatedIds = $util.emptyArray;

        /**
         * Creates a new InitData instance using the specified properties.
         * @function create
         * @memberof webChannel.InitData
         * @static
         * @param {webChannel.IInitData=} [properties] Properties to set
         * @returns {webChannel.InitData} InitData instance
         */
        InitData.create = function create(properties) {
            return new InitData(properties);
        };

        /**
         * Encodes the specified InitData message. Does not implicitly {@link webChannel.InitData.verify|verify} messages.
         * @function encode
         * @memberof webChannel.InitData
         * @static
         * @param {webChannel.IInitData} message InitData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        InitData.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.topology != null && message.hasOwnProperty("topology")) writer.uint32( /* id 1, wireType 0 =*/8).uint32(message.topology);
            if (message.wcId != null && message.hasOwnProperty("wcId")) writer.uint32( /* id 2, wireType 0 =*/16).uint32(message.wcId);
            if (message.generatedIds != null && message.generatedIds.length) {
                writer.uint32( /* id 3, wireType 2 =*/26).fork();
                for (var i = 0; i < message.generatedIds.length; ++i) {
                    writer.uint32(message.generatedIds[i]);
                }writer.ldelim();
            }
            return writer;
        };

        /**
         * Decodes an InitData message from the specified reader or buffer.
         * @function decode
         * @memberof webChannel.InitData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {webChannel.InitData} InitData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        InitData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webChannel.InitData();
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
                        if (!(message.generatedIds && message.generatedIds.length)) message.generatedIds = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2) {
                                message.generatedIds.push(reader.uint32());
                            }
                        } else message.generatedIds.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return InitData;
    }();

    webChannel.Peers = function () {

        /**
         * Properties of a Peers.
         * @memberof webChannel
         * @interface IPeers
         * @property {Array.<number>|null} [members] Peers members
         */

        /**
         * Constructs a new Peers.
         * @memberof webChannel
         * @classdesc Represents a Peers.
         * @implements IPeers
         * @constructor
         * @param {webChannel.IPeers=} [properties] Properties to set
         */
        function Peers(properties) {
            this.members = [];
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Peers members.
         * @member {Array.<number>} members
         * @memberof webChannel.Peers
         * @instance
         */
        Peers.prototype.members = $util.emptyArray;

        /**
         * Creates a new Peers instance using the specified properties.
         * @function create
         * @memberof webChannel.Peers
         * @static
         * @param {webChannel.IPeers=} [properties] Properties to set
         * @returns {webChannel.Peers} Peers instance
         */
        Peers.create = function create(properties) {
            return new Peers(properties);
        };

        /**
         * Encodes the specified Peers message. Does not implicitly {@link webChannel.Peers.verify|verify} messages.
         * @function encode
         * @memberof webChannel.Peers
         * @static
         * @param {webChannel.IPeers} message Peers message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Peers.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.members != null && message.members.length) {
                writer.uint32( /* id 1, wireType 2 =*/10).fork();
                for (var i = 0; i < message.members.length; ++i) {
                    writer.uint32(message.members[i]);
                }writer.ldelim();
            }
            return writer;
        };

        /**
         * Decodes a Peers message from the specified reader or buffer.
         * @function decode
         * @memberof webChannel.Peers
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {webChannel.Peers} Peers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Peers.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webChannel.Peers();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        if (!(message.members && message.members.length)) message.members = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2) {
                                message.members.push(reader.uint32());
                            }
                        } else message.members.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Peers;
    }();

    return webChannel;
}();

var channel = $root.channel = function () {

    /**
     * Namespace channel.
     * @exports channel
     * @namespace
     */
    var channel = {};

    channel.Message = function () {

        /**
         * Properties of a Message.
         * @memberof channel
         * @interface IMessage
         * @property {boolean|null} [heartbeat] Message heartbeat
         */

        /**
         * Constructs a new Message.
         * @memberof channel
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {channel.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message heartbeat.
         * @member {boolean} heartbeat
         * @memberof channel.Message
         * @instance
         */
        Message.prototype.heartbeat = false;

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof channel.Message
         * @static
         * @param {channel.IMessage=} [properties] Properties to set
         * @returns {channel.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link channel.Message.verify|verify} messages.
         * @function encode
         * @memberof channel.Message
         * @static
         * @param {channel.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.heartbeat != null && message.hasOwnProperty("heartbeat")) writer.uint32( /* id 1, wireType 0 =*/8).bool(message.heartbeat);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof channel.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {channel.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.channel.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
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
    }();

    return channel;
}();

var channelBuilder = $root.channelBuilder = function () {

    /**
     * Namespace channelBuilder.
     * @exports channelBuilder
     * @namespace
     */
    var channelBuilder = {};

    channelBuilder.Message = function () {

        /**
         * Properties of a Message.
         * @memberof channelBuilder
         * @interface IMessage
         * @property {channelBuilder.IConnection|null} [request] Message request
         * @property {channelBuilder.IConnection|null} [response] Message response
         * @property {string|null} [failed] Message failed
         */

        /**
         * Constructs a new Message.
         * @memberof channelBuilder
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {channelBuilder.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message request.
         * @member {channelBuilder.IConnection|null|undefined} request
         * @memberof channelBuilder.Message
         * @instance
         */
        Message.prototype.request = null;

        /**
         * Message response.
         * @member {channelBuilder.IConnection|null|undefined} response
         * @memberof channelBuilder.Message
         * @instance
         */
        Message.prototype.response = null;

        /**
         * Message failed.
         * @member {string} failed
         * @memberof channelBuilder.Message
         * @instance
         */
        Message.prototype.failed = "";

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Message type.
         * @member {"request"|"response"|"failed"|undefined} type
         * @memberof channelBuilder.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["request", "response", "failed"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof channelBuilder.Message
         * @static
         * @param {channelBuilder.IMessage=} [properties] Properties to set
         * @returns {channelBuilder.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link channelBuilder.Message.verify|verify} messages.
         * @function encode
         * @memberof channelBuilder.Message
         * @static
         * @param {channelBuilder.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.request != null && message.hasOwnProperty("request")) $root.channelBuilder.Connection.encode(message.request, writer.uint32( /* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.response != null && message.hasOwnProperty("response")) $root.channelBuilder.Connection.encode(message.response, writer.uint32( /* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.failed != null && message.hasOwnProperty("failed")) writer.uint32( /* id 3, wireType 2 =*/26).string(message.failed);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof channelBuilder.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {channelBuilder.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.channelBuilder.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.request = $root.channelBuilder.Connection.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.response = $root.channelBuilder.Connection.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.failed = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    channelBuilder.Connection = function () {

        /**
         * Properties of a Connection.
         * @memberof channelBuilder
         * @interface IConnection
         * @property {string|null} [wsUrl] Connection wsUrl
         * @property {boolean|null} [isWrtcSupport] Connection isWrtcSupport
         */

        /**
         * Constructs a new Connection.
         * @memberof channelBuilder
         * @classdesc Represents a Connection.
         * @implements IConnection
         * @constructor
         * @param {channelBuilder.IConnection=} [properties] Properties to set
         */
        function Connection(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Connection wsUrl.
         * @member {string} wsUrl
         * @memberof channelBuilder.Connection
         * @instance
         */
        Connection.prototype.wsUrl = "";

        /**
         * Connection isWrtcSupport.
         * @member {boolean} isWrtcSupport
         * @memberof channelBuilder.Connection
         * @instance
         */
        Connection.prototype.isWrtcSupport = false;

        /**
         * Creates a new Connection instance using the specified properties.
         * @function create
         * @memberof channelBuilder.Connection
         * @static
         * @param {channelBuilder.IConnection=} [properties] Properties to set
         * @returns {channelBuilder.Connection} Connection instance
         */
        Connection.create = function create(properties) {
            return new Connection(properties);
        };

        /**
         * Encodes the specified Connection message. Does not implicitly {@link channelBuilder.Connection.verify|verify} messages.
         * @function encode
         * @memberof channelBuilder.Connection
         * @static
         * @param {channelBuilder.IConnection} message Connection message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Connection.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.wsUrl != null && message.hasOwnProperty("wsUrl")) writer.uint32( /* id 1, wireType 2 =*/10).string(message.wsUrl);
            if (message.isWrtcSupport != null && message.hasOwnProperty("isWrtcSupport")) writer.uint32( /* id 2, wireType 0 =*/16).bool(message.isWrtcSupport);
            return writer;
        };

        /**
         * Decodes a Connection message from the specified reader or buffer.
         * @function decode
         * @memberof channelBuilder.Connection
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {channelBuilder.Connection} Connection
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Connection.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.channelBuilder.Connection();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.wsUrl = reader.string();
                        break;
                    case 2:
                        message.isWrtcSupport = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Connection;
    }();

    return channelBuilder;
}();

var fullMesh = $root.fullMesh = function () {

    /**
     * Namespace fullMesh.
     * @exports fullMesh
     * @namespace
     */
    var fullMesh = {};

    fullMesh.Message = function () {

        /**
         * Properties of a Message.
         * @memberof fullMesh
         * @interface IMessage
         * @property {fullMesh.IPeers|null} [connectTo] Message connectTo
         * @property {fullMesh.IPeers|null} [connectedTo] Message connectedTo
         * @property {number|null} [joiningPeerId] Message joiningPeerId
         * @property {boolean|null} [joinSucceed] Message joinSucceed
         * @property {boolean|null} [heartbeat] Message heartbeat
         */

        /**
         * Constructs a new Message.
         * @memberof fullMesh
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {fullMesh.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message connectTo.
         * @member {fullMesh.IPeers|null|undefined} connectTo
         * @memberof fullMesh.Message
         * @instance
         */
        Message.prototype.connectTo = null;

        /**
         * Message connectedTo.
         * @member {fullMesh.IPeers|null|undefined} connectedTo
         * @memberof fullMesh.Message
         * @instance
         */
        Message.prototype.connectedTo = null;

        /**
         * Message joiningPeerId.
         * @member {number} joiningPeerId
         * @memberof fullMesh.Message
         * @instance
         */
        Message.prototype.joiningPeerId = 0;

        /**
         * Message joinSucceed.
         * @member {boolean} joinSucceed
         * @memberof fullMesh.Message
         * @instance
         */
        Message.prototype.joinSucceed = false;

        /**
         * Message heartbeat.
         * @member {boolean} heartbeat
         * @memberof fullMesh.Message
         * @instance
         */
        Message.prototype.heartbeat = false;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Message type.
         * @member {"connectTo"|"connectedTo"|"joiningPeerId"|"joinSucceed"|"heartbeat"|undefined} type
         * @memberof fullMesh.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["connectTo", "connectedTo", "joiningPeerId", "joinSucceed", "heartbeat"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof fullMesh.Message
         * @static
         * @param {fullMesh.IMessage=} [properties] Properties to set
         * @returns {fullMesh.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link fullMesh.Message.verify|verify} messages.
         * @function encode
         * @memberof fullMesh.Message
         * @static
         * @param {fullMesh.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.connectTo != null && message.hasOwnProperty("connectTo")) $root.fullMesh.Peers.encode(message.connectTo, writer.uint32( /* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.connectedTo != null && message.hasOwnProperty("connectedTo")) $root.fullMesh.Peers.encode(message.connectedTo, writer.uint32( /* id 2, wireType 2 =*/18).fork()).ldelim();
            if (message.joiningPeerId != null && message.hasOwnProperty("joiningPeerId")) writer.uint32( /* id 3, wireType 0 =*/24).uint32(message.joiningPeerId);
            if (message.joinSucceed != null && message.hasOwnProperty("joinSucceed")) writer.uint32( /* id 4, wireType 0 =*/32).bool(message.joinSucceed);
            if (message.heartbeat != null && message.hasOwnProperty("heartbeat")) writer.uint32( /* id 5, wireType 0 =*/40).bool(message.heartbeat);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof fullMesh.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {fullMesh.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.fullMesh.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.connectTo = $root.fullMesh.Peers.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.connectedTo = $root.fullMesh.Peers.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.joiningPeerId = reader.uint32();
                        break;
                    case 4:
                        message.joinSucceed = reader.bool();
                        break;
                    case 5:
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
    }();

    fullMesh.Peers = function () {

        /**
         * Properties of a Peers.
         * @memberof fullMesh
         * @interface IPeers
         * @property {Array.<number>|null} [members] Peers members
         */

        /**
         * Constructs a new Peers.
         * @memberof fullMesh
         * @classdesc Represents a Peers.
         * @implements IPeers
         * @constructor
         * @param {fullMesh.IPeers=} [properties] Properties to set
         */
        function Peers(properties) {
            this.members = [];
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Peers members.
         * @member {Array.<number>} members
         * @memberof fullMesh.Peers
         * @instance
         */
        Peers.prototype.members = $util.emptyArray;

        /**
         * Creates a new Peers instance using the specified properties.
         * @function create
         * @memberof fullMesh.Peers
         * @static
         * @param {fullMesh.IPeers=} [properties] Properties to set
         * @returns {fullMesh.Peers} Peers instance
         */
        Peers.create = function create(properties) {
            return new Peers(properties);
        };

        /**
         * Encodes the specified Peers message. Does not implicitly {@link fullMesh.Peers.verify|verify} messages.
         * @function encode
         * @memberof fullMesh.Peers
         * @static
         * @param {fullMesh.IPeers} message Peers message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Peers.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.members != null && message.members.length) {
                writer.uint32( /* id 1, wireType 2 =*/10).fork();
                for (var i = 0; i < message.members.length; ++i) {
                    writer.uint32(message.members[i]);
                }writer.ldelim();
            }
            return writer;
        };

        /**
         * Decodes a Peers message from the specified reader or buffer.
         * @function decode
         * @memberof fullMesh.Peers
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {fullMesh.Peers} Peers
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Peers.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.fullMesh.Peers();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        if (!(message.members && message.members.length)) message.members = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2) {
                                message.members.push(reader.uint32());
                            }
                        } else message.members.push(reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Peers;
    }();

    return fullMesh;
}();

var webRTCBuilder = $root.webRTCBuilder = function () {

    /**
     * Namespace webRTCBuilder.
     * @exports webRTCBuilder
     * @namespace
     */
    var webRTCBuilder = {};

    webRTCBuilder.Message = function () {

        /**
         * Properties of a Message.
         * @memberof webRTCBuilder
         * @interface IMessage
         * @property {boolean|null} [isInitiator] Message isInitiator
         * @property {string|null} [offer] Message offer
         * @property {string|null} [answer] Message answer
         * @property {webRTCBuilder.IIceCandidate|null} [iceCandidate] Message iceCandidate
         * @property {boolean|null} [isError] Message isError
         * @property {boolean|null} [isEnd] Message isEnd
         */

        /**
         * Constructs a new Message.
         * @memberof webRTCBuilder
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {webRTCBuilder.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message isInitiator.
         * @member {boolean} isInitiator
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Message.prototype.isInitiator = false;

        /**
         * Message offer.
         * @member {string} offer
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Message.prototype.offer = "";

        /**
         * Message answer.
         * @member {string} answer
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Message.prototype.answer = "";

        /**
         * Message iceCandidate.
         * @member {webRTCBuilder.IIceCandidate|null|undefined} iceCandidate
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Message.prototype.iceCandidate = null;

        /**
         * Message isError.
         * @member {boolean} isError
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Message.prototype.isError = false;

        /**
         * Message isEnd.
         * @member {boolean} isEnd
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Message.prototype.isEnd = false;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Message type.
         * @member {"offer"|"answer"|"iceCandidate"|"isError"|"isEnd"|undefined} type
         * @memberof webRTCBuilder.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["offer", "answer", "iceCandidate", "isError", "isEnd"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof webRTCBuilder.Message
         * @static
         * @param {webRTCBuilder.IMessage=} [properties] Properties to set
         * @returns {webRTCBuilder.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link webRTCBuilder.Message.verify|verify} messages.
         * @function encode
         * @memberof webRTCBuilder.Message
         * @static
         * @param {webRTCBuilder.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.isInitiator != null && message.hasOwnProperty("isInitiator")) writer.uint32( /* id 1, wireType 0 =*/8).bool(message.isInitiator);
            if (message.offer != null && message.hasOwnProperty("offer")) writer.uint32( /* id 2, wireType 2 =*/18).string(message.offer);
            if (message.answer != null && message.hasOwnProperty("answer")) writer.uint32( /* id 3, wireType 2 =*/26).string(message.answer);
            if (message.iceCandidate != null && message.hasOwnProperty("iceCandidate")) $root.webRTCBuilder.IceCandidate.encode(message.iceCandidate, writer.uint32( /* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.isError != null && message.hasOwnProperty("isError")) writer.uint32( /* id 5, wireType 0 =*/40).bool(message.isError);
            if (message.isEnd != null && message.hasOwnProperty("isEnd")) writer.uint32( /* id 6, wireType 0 =*/48).bool(message.isEnd);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof webRTCBuilder.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {webRTCBuilder.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webRTCBuilder.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.isInitiator = reader.bool();
                        break;
                    case 2:
                        message.offer = reader.string();
                        break;
                    case 3:
                        message.answer = reader.string();
                        break;
                    case 4:
                        message.iceCandidate = $root.webRTCBuilder.IceCandidate.decode(reader, reader.uint32());
                        break;
                    case 5:
                        message.isError = reader.bool();
                        break;
                    case 6:
                        message.isEnd = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Message;
    }();

    webRTCBuilder.IceCandidate = function () {

        /**
         * Properties of an IceCandidate.
         * @memberof webRTCBuilder
         * @interface IIceCandidate
         * @property {string|null} [candidate] IceCandidate candidate
         * @property {string|null} [sdpMid] IceCandidate sdpMid
         * @property {number|null} [sdpMLineIndex] IceCandidate sdpMLineIndex
         */

        /**
         * Constructs a new IceCandidate.
         * @memberof webRTCBuilder
         * @classdesc Represents an IceCandidate.
         * @implements IIceCandidate
         * @constructor
         * @param {webRTCBuilder.IIceCandidate=} [properties] Properties to set
         */
        function IceCandidate(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * IceCandidate candidate.
         * @member {string} candidate
         * @memberof webRTCBuilder.IceCandidate
         * @instance
         */
        IceCandidate.prototype.candidate = "";

        /**
         * IceCandidate sdpMid.
         * @member {string} sdpMid
         * @memberof webRTCBuilder.IceCandidate
         * @instance
         */
        IceCandidate.prototype.sdpMid = "";

        /**
         * IceCandidate sdpMLineIndex.
         * @member {number} sdpMLineIndex
         * @memberof webRTCBuilder.IceCandidate
         * @instance
         */
        IceCandidate.prototype.sdpMLineIndex = 0;

        /**
         * Creates a new IceCandidate instance using the specified properties.
         * @function create
         * @memberof webRTCBuilder.IceCandidate
         * @static
         * @param {webRTCBuilder.IIceCandidate=} [properties] Properties to set
         * @returns {webRTCBuilder.IceCandidate} IceCandidate instance
         */
        IceCandidate.create = function create(properties) {
            return new IceCandidate(properties);
        };

        /**
         * Encodes the specified IceCandidate message. Does not implicitly {@link webRTCBuilder.IceCandidate.verify|verify} messages.
         * @function encode
         * @memberof webRTCBuilder.IceCandidate
         * @static
         * @param {webRTCBuilder.IIceCandidate} message IceCandidate message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        IceCandidate.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.candidate != null && message.hasOwnProperty("candidate")) writer.uint32( /* id 1, wireType 2 =*/10).string(message.candidate);
            if (message.sdpMid != null && message.hasOwnProperty("sdpMid")) writer.uint32( /* id 2, wireType 2 =*/18).string(message.sdpMid);
            if (message.sdpMLineIndex != null && message.hasOwnProperty("sdpMLineIndex")) writer.uint32( /* id 3, wireType 0 =*/24).uint32(message.sdpMLineIndex);
            return writer;
        };

        /**
         * Decodes an IceCandidate message from the specified reader or buffer.
         * @function decode
         * @memberof webRTCBuilder.IceCandidate
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {webRTCBuilder.IceCandidate} IceCandidate
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        IceCandidate.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.webRTCBuilder.IceCandidate();
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
    }();

    return webRTCBuilder;
}();

var signaling = $root.signaling = function () {

    /**
     * Namespace signaling.
     * @exports signaling
     * @namespace
     */
    var signaling = {};

    signaling.Message = function () {

        /**
         * Properties of a Message.
         * @memberof signaling
         * @interface IMessage
         * @property {signaling.IContent|null} [content] Message content
         * @property {boolean|null} [isFirst] Message isFirst
         * @property {boolean|null} [joined] Message joined
         * @property {boolean|null} [heartbeat] Message heartbeat
         */

        /**
         * Constructs a new Message.
         * @memberof signaling
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {signaling.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Message content.
         * @member {signaling.IContent|null|undefined} content
         * @memberof signaling.Message
         * @instance
         */
        Message.prototype.content = null;

        /**
         * Message isFirst.
         * @member {boolean} isFirst
         * @memberof signaling.Message
         * @instance
         */
        Message.prototype.isFirst = false;

        /**
         * Message joined.
         * @member {boolean} joined
         * @memberof signaling.Message
         * @instance
         */
        Message.prototype.joined = false;

        /**
         * Message heartbeat.
         * @member {boolean} heartbeat
         * @memberof signaling.Message
         * @instance
         */
        Message.prototype.heartbeat = false;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Message type.
         * @member {"content"|"isFirst"|"joined"|"heartbeat"|undefined} type
         * @memberof signaling.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["content", "isFirst", "joined", "heartbeat"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof signaling.Message
         * @static
         * @param {signaling.IMessage=} [properties] Properties to set
         * @returns {signaling.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link signaling.Message.verify|verify} messages.
         * @function encode
         * @memberof signaling.Message
         * @static
         * @param {signaling.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.content != null && message.hasOwnProperty("content")) $root.signaling.Content.encode(message.content, writer.uint32( /* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.isFirst != null && message.hasOwnProperty("isFirst")) writer.uint32( /* id 2, wireType 0 =*/16).bool(message.isFirst);
            if (message.joined != null && message.hasOwnProperty("joined")) writer.uint32( /* id 3, wireType 0 =*/24).bool(message.joined);
            if (message.heartbeat != null && message.hasOwnProperty("heartbeat")) writer.uint32( /* id 4, wireType 0 =*/32).bool(message.heartbeat);
            return writer;
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof signaling.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {signaling.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.signaling.Message();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.content = $root.signaling.Content.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.isFirst = reader.bool();
                        break;
                    case 3:
                        message.joined = reader.bool();
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
    }();

    signaling.Content = function () {

        /**
         * Properties of a Content.
         * @memberof signaling
         * @interface IContent
         * @property {number|null} [id] Content id
         * @property {Uint8Array|null} [data] Content data
         * @property {boolean|null} [isError] Content isError
         * @property {boolean|null} [isEnd] Content isEnd
         */

        /**
         * Constructs a new Content.
         * @memberof signaling
         * @classdesc Represents a Content.
         * @implements IContent
         * @constructor
         * @param {signaling.IContent=} [properties] Properties to set
         */
        function Content(properties) {
            if (properties) for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i) {
                if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
            }
        }

        /**
         * Content id.
         * @member {number} id
         * @memberof signaling.Content
         * @instance
         */
        Content.prototype.id = 0;

        /**
         * Content data.
         * @member {Uint8Array} data
         * @memberof signaling.Content
         * @instance
         */
        Content.prototype.data = $util.newBuffer([]);

        /**
         * Content isError.
         * @member {boolean} isError
         * @memberof signaling.Content
         * @instance
         */
        Content.prototype.isError = false;

        /**
         * Content isEnd.
         * @member {boolean} isEnd
         * @memberof signaling.Content
         * @instance
         */
        Content.prototype.isEnd = false;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields = void 0;

        /**
         * Content type.
         * @member {"data"|"isError"|"isEnd"|undefined} type
         * @memberof signaling.Content
         * @instance
         */
        Object.defineProperty(Content.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["data", "isError", "isEnd"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Content instance using the specified properties.
         * @function create
         * @memberof signaling.Content
         * @static
         * @param {signaling.IContent=} [properties] Properties to set
         * @returns {signaling.Content} Content instance
         */
        Content.create = function create(properties) {
            return new Content(properties);
        };

        /**
         * Encodes the specified Content message. Does not implicitly {@link signaling.Content.verify|verify} messages.
         * @function encode
         * @memberof signaling.Content
         * @static
         * @param {signaling.IContent} message Content message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Content.encode = function encode(message, writer) {
            if (!writer) writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id")) writer.uint32( /* id 1, wireType 0 =*/8).uint32(message.id);
            if (message.data != null && message.hasOwnProperty("data")) writer.uint32( /* id 2, wireType 2 =*/18).bytes(message.data);
            if (message.isError != null && message.hasOwnProperty("isError")) writer.uint32( /* id 3, wireType 0 =*/24).bool(message.isError);
            if (message.isEnd != null && message.hasOwnProperty("isEnd")) writer.uint32( /* id 4, wireType 0 =*/32).bool(message.isEnd);
            return writer;
        };

        /**
         * Decodes a Content message from the specified reader or buffer.
         * @function decode
         * @memberof signaling.Content
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {signaling.Content} Content
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Content.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length,
                message = new $root.signaling.Content();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                    case 1:
                        message.id = reader.uint32();
                        break;
                    case 2:
                        message.data = reader.bytes();
                        break;
                    case 3:
                        message.isError = reader.bool();
                        break;
                    case 4:
                        message.isEnd = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                }
            }
            return message;
        };

        return Content;
    }();

    return signaling;
}();

export { Message, user, service, webChannel, channel, channelBuilder, fullMesh, webRTCBuilder, signaling };
export default $root;
