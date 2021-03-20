import { Transform } from 'stream';

import { PacketType } from './packet';

export class Decoder extends Transform {
  private firstChunk = true;
  private packetSize = 0;
  private packetType = PacketType.JSON;
  private jsonBuffer = '';
  private rawConsumed = 0;

  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: Buffer,
    _enc: BufferEncoding,
    cb: (err?: Error | null | undefined) => void
  ) {
    if (this.firstChunk) {
      this.readHeader(chunk);
      chunk = chunk.slice(5);
      this.firstChunk = false;
    }

    if (this.packetType === PacketType.JSON) {
      this.jsonBuffer += chunk;

      if (this.jsonBuffer.length >= this.packetSize) {
        try {
          const json = JSON.parse(this.jsonBuffer);
          this.push({ type: 'json', data: json });
          this.jsonBuffer = '';
          this.firstChunk = true;
        } catch (err) {
          cb(err);
          return;
        }
      }
    } else if (this.packetType === PacketType.RAW) {
      this.rawConsumed += chunk.length;

      const end = this.rawConsumed >= this.packetSize;
      if (end) {
        this.firstChunk = true;
        this.rawConsumed = 0;
      }
      this.push({ type: 'raw', data: chunk, end });
    }
    cb();
  }

  private readHeader(chunk: Buffer) {
    this.packetType = chunk.readUInt8(0);
    this.packetSize = chunk.readUInt32BE(1);
  }
}
