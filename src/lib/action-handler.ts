import { Action } from './actions';
import { JsonPacket } from './packet';

export class ActionHandler {
  private lastJson: JsonPacket | null = null;

  constructor(private actionHandlers: Record<JsonPacket['action'], Action>) {}

  async processJson(data: JsonPacket) {
    console.log('Got json: ', data);
    this.lastJson = data;
    const action = this.getAction(data.action);
    await action?.processJson(data);
  }

  async processRaw(data: Buffer, end: boolean) {
    console.log(`Got raw: ${data.length}B`);
    if (!this.lastJson) {
      throw new Error('Sending raw data first is not allowed');
    }

    const action = this.getAction(this.lastJson.action);
    await action?.processRaw(data, end, this.lastJson);
  }

  private getAction(actionType: JsonPacket['action']): Action {
    const action = this.actionHandlers[actionType];
    if (!action) {
      throw new Error(`No action has found for ${actionType}`);
    }

    return action;
  }
}
