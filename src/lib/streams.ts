import { Readable, Transform, Writable } from 'stream';

import { ActionHandler } from './action-handler';
import { JsonPacket, PacketType } from './packet';

export class BufferReadStream extends Readable {
  private pos = 0;

  constructor(private buf: Buffer) {
    super();
  }

  _read(n: number) {
    const start = this.pos;
    const end = this.pos + n;

    if (start >= this.buf.length) {
      this.push(null);
      return;
    }

    this.push(this.buf.slice(start, end));
    this.pos = end;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export class JsonStream<T extends object> extends BufferReadStream {
  constructor(json: T) {
    const stringified = Buffer.from(JSON.stringify(json));
    const header = Buffer.alloc(5);
    header.writeUInt8(PacketType.JSON, 0);
    header.writeUInt32BE(header.length, 1);
    const buf = Buffer.concat([header, stringified]);

    super(buf);
  }
}

export class HeaderStream extends Transform {
  private emittedHeader = false;

  constructor(private type: PacketType, private size: number) {
    super();
  }

  _transform(
    chunk: Buffer,
    _enc: BufferEncoding,
    cb: (err?: Error | null | undefined) => void
  ) {
    if (!this.emittedHeader) {
      const header = Buffer.alloc(5);
      header.writeUInt8(this.type, 0);
      header.writeUInt32BE(this.size, 1);
      this.push(header);
      this.emittedHeader = true;
    }

    this.push(chunk);
    cb();
  }
}

export class ActionConsumer extends Writable {
  constructor(private actionHandler: ActionHandler) {
    super({ objectMode: true });
  }

  async _write(
    chunk:
      | { type: 'json'; data: JsonPacket }
      | { type: 'raw'; data: Buffer; end: boolean },
    _enc: BufferEncoding,
    cb: (err?: Error | null | undefined) => void
  ) {
    if (chunk.type === 'json') {
      await this.actionHandler.processJson(chunk.data);
    } else if (chunk.type === 'raw') {
      await this.actionHandler.processRaw(chunk.data, chunk.end);
    }
    cb();
  }
}
