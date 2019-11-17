export = Fork;
declare const Fork_base: any;
/**
 * @class Fork
 */
declare class Fork extends Fork_base {
  /**
   * @constructor
   * @param {Writable[]} streams - Array of Writable streams
   * @param {Object} [options] - see [https://nodejs.org/...](https://nodejs.org/dist/latest/docs/api/stream.html#stream_constructor_new_stream_writable_options)
   */
  constructor(streams: any[], options?: Object | undefined);
  streams: any[];
  results: any;
  /**
   * @param {Stream[]} streams - Array of streams
   * @param {Object} [options] - see [https://nodejs.org/...](https://nodejs.org/dist/latest/docs/api/stream.html#stream_constructor_new_stream_writable_options)
   * @return {Fork}
   */
  static fork(streams: any[], options?: Object | undefined): Fork;
}
