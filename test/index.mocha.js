/**
 * @copyright 2019 commenthol
 * @license MIT
 */

'use strict'

const assert = require('assert')
const path = require('path')
const fs = require('fs')
const { rm, mkdir } = require('shelljs')
const { through, ReadBuffer } = require('streamss')
const { fork } = require('../')

const fixture = path.resolve(__dirname, 'fixtures/abcdef.txt')

const abc = (cnt = 0) => new Array(cnt + 1).fill('abcdefghijklnmopqrstuvwxyz').join('\n')

const createFork = (exp, done, order, num) => {
  const arr = []

  return through(
    function transform (data) {
      arr.push(data.toString())
    },
    function flush () {
      order && order.push(num)
      exp && assert.strictEqual(arr.join(''), exp)
      done && done()
    }
  )
}

describe('#fork', function () {
  it('shall fork one stream', function (done) {
    const inp = abc(10)
    const stream = new ReadBuffer(inp)

    const forked = createFork(inp, done)

    stream.pipe(fork([forked]))
  })

  it('shall fork and pipe', function (done) {
    const cnt = 1000
    let i = 1
    const inp = abc(cnt)
    const stream = new ReadBuffer(inp)
    const order = []

    const forked1 = createFork(inp, undefined, order, i++)
    const forked2 = createFork(inp, undefined, order, i++)
    const forked3 = createFork(inp, undefined, order, i++)
    const piped = through(
      function () {},
      function flush () {
        // with node >= 14 the last pipe is flushed first
        setTimeout(() => {
          assert.deepStrictEqual(order, [1, 2, 3])
          done()
        })
      }
    )

    stream.pipe(fork([forked1, forked2, forked3])).pipe(piped)
  })

  it('shall fork and pipe from fs stream', function (done) {
    const inp = abc(10) + '\n'
    const stream = fs.createReadStream(fixture)
    const order = []

    const forked1 = createFork(inp, undefined, order, 1)
    const forked2 = createFork(inp, undefined, order, 2)
    const piped = through(
      function () {},
      function flush () {
        // with node >= 14 the last pipe is flushed first
        setTimeout(() => {
          assert.deepStrictEqual(order, [1, 2])
          done()
        })
      }
    )

    stream.pipe(fork([forked1, forked2])).pipe(piped)
  })

  it('shall fork with pipe to fs streams', function (done) {
    const inp = abc(10) + '\n'
    const stream = new ReadBuffer(inp)
    const dirname = path.resolve(__dirname, 'tmp')
    const filename = `${dirname}/fork`

    rm('-rf', dirname)
    mkdir('-p', dirname)

    const forked1 = through().pipe(fs.createWriteStream(filename + '1.log'))
    const forked2 = through().pipe(fs.createWriteStream(filename + '2.log'))
    const piped = through(
      function () {},
      function flush () {
        assert.strictEqual(fs.readFileSync(filename + '1.log', 'utf8'), inp)
        assert.strictEqual(fs.readFileSync(filename + '2.log', 'utf8'), inp)
        rm('-rf', dirname)
        done()
      }
    )

    stream.pipe(fork([forked1, forked2])).pipe(piped)
  })

  it('early end in pipe', function (done) {
    const inp = abc(10000)
    const stream = new ReadBuffer(inp)
    const cache = {
      cntp: 0,
      cntf: 0,
      forkEnd: false
    }

    const forked = through(
      function () {
        cache.cntf++
      },
      function () {
        cache.forkEnd = true
      }
    )
    forked.on('finish', () => console.log('+++ never reaches here +++')) // never reaches here as pipe stops writing
    const piped = through(
      function (data, enc, cb) {
        cache.cntp++
        if (cache.cntp === 3) {
          this.end() // usually you should not do this in a sink - always end at the source
        }
        cb()
      },
      function () {
        setTimeout(() => {
          assert.deepStrictEqual(cache, { cntp: 3, cntf: 4, forkEnd: false })
          done()
        })
      }
    )

    stream.pipe(fork([forked])).pipe(piped)
  })

  it('early end in fork', function (done) {
    const inp = abc(10000)
    const stream = new ReadBuffer({ highWaterMark: 1000 }, inp)
    const cache = {
      cntp: 0,
      cntf: 0,
      forkEnd: false
    }

    const forked = through(
      function () {
        cache.cntf++
        if (cache.cntf === 3) this.end()
      },
      function () {
        cache.forkEnd = true
      }
    )
    const piped = through(
      function (data) {
        cache.cntp++
      },
      function () {
        assert.deepStrictEqual(cache, { cntp: 271, cntf: 3, forkEnd: true })
        assert.strictEqual(_forks.results[0].message, 'stream not writable')
        done()
      }
    )
    let _forks
    stream.pipe(_forks = fork([forked])).pipe(piped)
  })

  it('shall forward errors to forks and pipe', function (done) {
    const stream = new ReadBuffer(abc(100))
    const cache = {}

    const forked = through()
    forked.on('error', (err) => {
      assert.ok(err instanceof Error)
      cache.err = err
    })

    stream.pipe(fork([forked]))
      .on('error', function (err) {
        assert.ok(err instanceof Error)
        assert.strictEqual(err.message, cache.err.message)
        done()
      })

    stream.emit('error', new Error('bam'))
  })

  it('shall not forward errors with passError=false', function (done) {
    const stream = new ReadBuffer(abc(100))
    const cache = {}

    const forked = through()
    forked.on('error', (err) => {
      assert.ok(err instanceof Error)
      cache.err = err
    })

    assert.throws(() => {
      stream.pipe(fork([forked], { passError: false }))
        .on('error', function () {
          assert.ok(false)
        })

      stream.emit('error', new Error('bam'))
    }, (err) => {
      assert.strictEqual(String(err), 'Error: bam')
      done()
    })
  })

  it('shall terminate forks on error in pipe', function (done) {
    const stream = new ReadBuffer(abc(100))
    const cache = {}

    const forked = through()
    forked.on('data', () => {})
    forked.on('error', (err) => {
      cache.err = err.message // never reaches here
    })
    forked.on('end', () => {
      cache.forkEnd = true
    })
    const piped = through()
    piped.on('data', () => {})
    piped.on('error', () => {
      setTimeout(() => {
        assert.deepStrictEqual(cache, { forkEnd: true })
        done()
      }, 30)
    })

    const _forks = fork([forked])

    stream.pipe(_forks).pipe(piped)

    piped.emit('error', new Error('bam'))
  })
})
