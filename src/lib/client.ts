import { Socket } from 'net';

import { ActionHandler } from './action-handler';
import {
  Action,
  AddDirAction,
  AddFileAction,
  RemoveDirAction,
  RemoveFileAction,
  WriteFileAction,
} from './actions';
import { Decoder } from './decoder';
import { DiscoveryClient } from './discovery';
import { JsonPacket } from './packet';
import { ActionConsumer } from './streams';

export function client({
  filepath,
  host,
  port,
  discovery,
}: {
  filepath: string;
  ignored?: any;
  host: string;
  port: number;
  discovery: boolean;
}) {
  if (discovery) {
    const discovery = new DiscoveryClient();
    discovery.start();

    discovery.once('found', (host: string) => {
      connect({ host, port, filepath });
      discovery.stop();
    });
  } else {
    connect({ host, port, filepath });
  }
}

function connect({
  host,
  port,
  filepath,
}: {
  host: string;
  port: number;
  filepath: string;
}) {
  const socket = new Socket();
  socket.connect(port, host, () => {
    console.log(`Connected to server`);

    const actionHandlers: Record<JsonPacket['action'], Action> = {
      'write-file': new WriteFileAction(filepath),
      'add-file': new AddFileAction(filepath),
      'remove-file': new RemoveFileAction(filepath),
      'add-dir': new AddDirAction(filepath),
      'remove-dir': new RemoveDirAction(filepath),
    };

    const actionHandler = new ActionConsumer(new ActionHandler(actionHandlers));
    socket.pipe(new Decoder()).pipe(actionHandler);
  });
}
