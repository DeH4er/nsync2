import { once } from 'events';
import { createReadStream, Stats } from 'fs';
import { createServer, Socket } from 'net';
import { relative } from 'path';
import { Readable } from 'stream';

import { watch } from 'chokidar';

import { JsonPacket, PacketType } from './packet';
import { HeaderStream, JsonStream } from './streams';

export async function server({
  filepath,
  ignored,
  host,
  port,
}: {
  filepath: string;
  ignored?: any;
  host: string;
  port: number;
}) {
  const server = new Server(host, port);
  server.start();

  const watcher = watch(filepath, { ignored, alwaysStat: true });

  watcher.on('add', (path: string) => {
    server.sendJson({ action: 'add-file', path: relative(filepath, path) });
  });

  watcher.on('change', (path: string, stats: Stats) => {
    server.sendJson({ action: 'write-file', path: relative(filepath, path) });
    server.sendFile(path, stats.size);
  });

  watcher.on('unlink', (path: string) => {
    server.sendJson({ action: 'remove-file', path: relative(filepath, path) });
  });

  watcher.on('addDir', (path: string) => {
    server.sendJson({ action: 'add-dir', path: relative(filepath, path) });
  });

  watcher.on('unlinkDir', (path: string) => {
    server.sendJson({ action: 'remove-dir', path: relative(filepath, path) });
  });

  watcher.on('error', (err: Error) => {
    console.log(`Chokidar err: ${err}`);
  });

  await once(watcher, 'ready');
  console.log('Watcher ready');
}

export class Server {
  private clients: Socket[] = [];
  private streamQueue: Readable[] = [];
  private isProcessingQueue = false;

  constructor(private host = '0.0.0.0', private port = 4255) {}

  start() {
    createServer(async (client: Socket) => {
      console.log(`Client connected ${client.remotePort}`);

      this.clients.push(client);

      client.on('close', () => {
        this.clients = this.clients.filter((c) => c !== client);
      });
    }).listen(this.port, this.host);
  }

  attachStream(stream: Readable): void {
    (async () => {
      this.streamQueue.unshift(stream);

      if (this.isProcessingQueue) {
        return Promise.resolve();
      }

      this.isProcessingQueue = true;

      let s: Readable | undefined;
      while ((s = this.streamQueue.pop()) !== undefined) {
        await this.attachStreamForce(s);
      }

      this.isProcessingQueue = false;
    })();
  }

  sendJson(json: JsonPacket): void {
    this.attachStream(this.createJsonStream(json));
  }

  sendRaw(stream: Readable, size: number): void {
    this.attachStream(this.createRawStream(stream, size));
  }

  sendFile(filepath: string, size: number): void {
    const fileStream = createReadStream(filepath);
    this.sendRaw(fileStream, size);
  }

  private async attachStreamForce(stream: Readable): Promise<void> {
    await Promise.all(
      this.clients.map(
        (client: Socket) =>
          new Promise<void>((resolve, reject) => {
            stream.once('end', onEnd);
            stream.once('error', onError);

            stream.pipe(client, { end: false });

            function onEnd() {
              clean();
              resolve();
            }

            function onError(err: Error) {
              clean();
              reject(err);
            }

            function clean() {
              stream.removeListener('end', onEnd);
              stream.removeListener('error', onError);
            }
          })
      )
    );
  }

  private createJsonStream(json: JsonPacket) {
    return new JsonStream(json);
  }

  private createRawStream(stream: Readable, size: number) {
    return stream.pipe(new HeaderStream(PacketType.RAW, size));
  }
}