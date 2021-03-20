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
import { JsonPacket } from './packet';
import { ActionConsumer } from './streams';

export function client({
  filepath,
  host,
  port,
}: {
  filepath: string;
  ignored?: any;
  host: string;
  port: number;
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
