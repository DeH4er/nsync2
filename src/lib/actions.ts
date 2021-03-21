import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { once, Writable } from 'stream';

import mkdirp from 'mkdirp';

import { JsonPacket, WriteFile } from './packet';
import { rmrf } from './utils';

export abstract class Action {
  abstract processJson(data: JsonPacket): Promise<void>;

  processRaw(_data: Buffer, _end: boolean, packet: JsonPacket): Promise<void> {
    throw new Error(
      `Processing raw files is not allowed for action ${packet.action}`
    );
  }
}

export class WriteFileAction extends Action {
  private writeFileStream: Writable | null = null;

  constructor(private filepath: string) {
    super();
  }

  async processJson(data: WriteFile) {
    const path = join(this.filepath, data.path);
    await mkdirp(dirname(path));
    this.writeFileStream = createWriteStream(path);
  }

  async processRaw(data: Buffer, end: boolean, packet: WriteFile) {
    if (!this.writeFileStream) {
      throw new Error('Trying to write file before sending json meta');
    }

    const path = join(this.filepath, packet.path);
    if (end) {
      this.writeFileStream.end(data);
      console.log(`File has written ${path}`);
    } else {
      if (!this.writeFileStream.write(data)) {
        await once(this.writeFileStream, 'drain');
      }
    }
  }
}

export class AddFileAction extends Action {
  constructor(private filepath: string) {
    super();
  }

  async processJson(data: WriteFile) {
    const path = join(this.filepath, data.path);
    await writeFile(path, '');
    console.log(`File has added ${path}`);
  }
}

export class RemoveFileAction extends Action {
  constructor(private filepath: string) {
    super();
  }

  async processJson(data: JsonPacket): Promise<void> {
    const path = join(this.filepath, data.path);
    await rmrf(path);
    console.log(`File has removed ${path}`);
  }
}

export class RemoveDirAction extends Action {
  constructor(private filepath: string) {
    super();
  }

  async processJson(data: JsonPacket): Promise<void> {
    const path = join(this.filepath, data.path);
    await rmrf(path);
    console.log(`Dir has removed ${path}`);
  }
}

export class AddDirAction extends Action {
  constructor(private filepath: string) {
    super();
  }

  async processJson(data: JsonPacket): Promise<void> {
    const path = join(this.filepath, data.path);
    await mkdirp(path);
    console.log(`Dir has added ${path}`);
  }
}
