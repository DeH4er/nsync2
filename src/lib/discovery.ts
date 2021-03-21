import { createSocket, RemoteInfo, Socket } from 'dgram';
import EventEmitter from 'events';

const MCAST_ADDR = '230.195.190.190';
const PORT = 41850;

export class DiscoveryServer {
  private socket: Socket | null = null;
  private discoveryIntervalId: NodeJS.Timeout | null = null;

  start() {
    console.log(`Starting discovery server`);
    this.socket = createSocket({ type: 'udp4', reuseAddr: true });

    this.socket.bind(PORT);

    this.socket.on('listening', () => {
      console.log(
        `Server listening on address ${JSON.stringify(this?.socket?.address())}`
      );

      this.socket?.setBroadcast(true);
      this.socket?.setMulticastTTL(128);
      this.socket?.addMembership(MCAST_ADDR);

      this.discoveryIntervalId = setInterval(() => {
        console.log(`Send discovery packet`);
        this.socket?.send('', PORT, MCAST_ADDR);
      }, 5000);
    });
  }

  stop() {
    this.discoveryIntervalId ? clearInterval(this.discoveryIntervalId) : null;
    this.socket?.close();
  }
}

export class DiscoveryClient extends EventEmitter {
  private socket: Socket | null = null;

  start() {
    console.log(`Starting discovery client`);
    this.socket = createSocket({ type: 'udp4', reuseAddr: true });
    this.socket.bind(PORT);

    this.socket.on('message', (_msg: Buffer, rinfo: RemoteInfo) => {
      console.log(`Server found at ${rinfo.address}`)
      this.emit('found', rinfo.address);
    });

    this.socket.on('listening', () => {
      console.log(
        `Server listening on address ${JSON.stringify(this?.socket?.address())}`
      );

      this.socket?.setBroadcast(true);
      this.socket?.setMulticastTTL(128);
      this.socket?.addMembership(MCAST_ADDR);
    });
  }

  stop() {
    this.socket?.close();
  }
}
