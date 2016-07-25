import {signaling, randArrayBuffer, randString} from 'config'
import WebChannel from 'src/WebChannel'

describe('Should send & receive (between 2 peers) -> ', () => {
  let wc1, wc2
  let buffer
  let str

  function isEqual (ta1, ta2) {
    return ta1.every((value, index) => {
      return value === ta2[index]
    })
  }

  beforeAll((done) => {
    buffer = randArrayBuffer(8, 200)
    str = randString()
    // Peer #1
    wc1 = new WebChannel({signaling})
    wc1.open().then((data) => {
      // Peer #2
      wc2 = new WebChannel({signaling})
      wc2.join(data.key).then(() => {
        done()
      })
        .catch(done.fail)
    }).catch(done.fail)
  })

  it('ArrayBuffer', (done) => {
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof ArrayBuffer).toBeTruthy()
      expect(isEqual(new Uint8Array(buffer), new Uint8Array(msg))).toBeTruthy()
      done()
    }
    wc2.send(buffer)
  })

  it('Uint8Array', (done) => {
    let original = new Uint8Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Uint8Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('String', (done) => {
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Uint8Array || typeof msg === 'string').toBeTruthy()
      expect(msg).toEqual(str)
      done()
    }
    wc2.send(str)
  })

  it('Int8Array', (done) => {
    let original = new Int8Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Int8Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('Uint8ClampedArray', (done) => {
    let original = new Uint8ClampedArray(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Uint8ClampedArray).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('Int16Array', (done) => {
    let original = new Int16Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Int16Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('Uint16Array', (done) => {
    let original = new Uint16Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Uint16Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('Int32Array', (done) => {
    let original = new Int32Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Int32Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('Uint32Array', (done) => {
    let original = new Uint32Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Uint32Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  xit('Float32Array', (done) => {
    let original = new Float32Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Float32Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('Float64Array', (done) => {
    let original = new Float64Array(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof Float64Array).toBeTruthy()
      expect(isEqual(original, msg)).toBeTruthy()
      done()
    }
    wc2.send(original)
  })

  it('DataView', (done) => {
    let original = new DataView(buffer)
    wc1.onMessage = (id, msg) => {
      expect(msg instanceof DataView).toBeTruthy()
      expect(isEqual(new Uint8Array(buffer), new Uint8Array(msg.buffer))).toBeTruthy()
      done()
    }
    wc2.send(original)
  })
})
