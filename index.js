/**
 * @module streamss-fork
 * @copyright 2019 commenthol
 * @licence MIT
 */

const { Transform } = require('stream')

const writeToStream = (chunk, enc) => (stream) =>
  new Promise(resolve => {
    if (stream.writable) {
      stream.write(chunk, enc, (err) => {
        resolve(err)
      })
    } else {
      resolve(new Error('stream not writable'))
    }
  })

/**
 * @class Fork
 */
class Fork extends Transform {
  /**
   * @constructor
   * @param {Writable[]} streams - Array of Writable streams
   * @param {Object} [options] - see [https://nodejs.org/...](https://nodejs.org/dist/latest/docs/api/stream.html#stream_constructor_new_stream_writable_options)
   */
  constructor (streams, options = {}) {
    super(options)
    this.streams = streams
    this.results = new Array(streams.length)

    const emit = (event, arg) => {
      this.streams.forEach(stream => stream.emit(event, arg))
    }
    const finish = () => {
      this.streams.forEach(stream => stream.end())
    }

    this.on('error', err => emit('error', err))
    this.once('close', () => emit('close'))
    this.once('end', () => emit('end'))
    this.once('finish', () => finish())
    this.on('pipe', (src) => {
      if (options.passError !== false) {
        src.on('error', (err) => {
          this.emit('error', err)
        })
      }
    })
  }

  _transform (chunk, enc, done) {
    Promise.all(
      this.streams.map(writeToStream(chunk, enc))
    ).then(results => {
      this.results = results.map((result, i) => result || this.results[i])
      this.push(chunk, enc)
      done()
    })
  }

  /**
   * @param {Stream[]} streams - Array of streams
   * @param {Object} [options] - see [https://nodejs.org/...](https://nodejs.org/dist/latest/docs/api/stream.html#stream_constructor_new_stream_writable_options)
   * @return {Fork}
   */
  static fork (streams, options) {
    return new Fork(streams, options)
  }
}

module.exports = Fork
