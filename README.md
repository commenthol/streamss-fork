# streamss-fork

> Fork stream2 into several streams

[![NPM version](https://badge.fury.io/js/streamss-fork.svg)](https://www.npmjs.com/package/streamss-fork/)
[![Build Status](https://secure.travis-ci.org/commenthol/streamss-fork.svg?branch=master)](https://travis-ci.org/commenthol/streamss-fork)

Fork a single stream into multiple other streams.
The main stream can be piped as well.

## Install

    npm i -S streamss-fork

## Example

**Fork a stream**

Same as `cat package.json | tee one.log two.log` in bash...

```js
const fs = require('fs')
const { fork } = require('streamss-fork')

const one = fs.createWriteStream(`./one.log`)
const two = fs.createWriteStream(`./two.log`)

fs.createReadStream(`./package.json`)
  .pipe(fork([one, two]/* ,{ objectMode: false }*/))
  .pipe(process.stdout)
```


## Methods

### fork([streams], options)

**Parameters:**

- `{Writable[]} streams` - Array of Writable Streams
- `{Object} [options]` - see [https://nodejs.org/...](https://nodejs.org/dist/latest/docs/api/stream.html#stream_constructor_new_stream_writable_options)

**Return:**

`{Transform}` A Transform stream


## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your
code to be distributed under the MIT license. You are also implicitly
verifying that all code is your original work or correctly attributed
with the source of its origin and licence.


## License

Copyright (c) 2019 commenthol (MIT License)

See [LICENSE][] for more info.

[LICENSE]: ./LICENSE
[stream-cat]: https://github.com/micnews/stream-cat
[Readable]: http://nodejs.org/api/stream.html#stream_class_stream_readable
[readable-stream]: https://github.com/isaacs/readable-stream
