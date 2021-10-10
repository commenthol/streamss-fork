/* eslint-disable node/no-path-concat */

const fs = require('fs')
const { fork } = require('..')

const one = fs.createWriteStream(`${__dirname}/one.log`)
const two = fs.createWriteStream(`${__dirname}/two.log`)

fs.createReadStream(`${__dirname}/../package.json`)
  .pipe(fork([one, two]))
  .pipe(process.stdout)
