export enum PacketType {
  JSON = 0,
  RAW = 1,
}

export interface WriteFile {
  action: 'write-file';
  path: string;
}

export interface AddFile {
  action: 'add-file';
  path: string;
}

export interface RemoveFile {
  action: 'remove-file';
  path: string;
}

export interface RemoveDir {
  action: 'remove-dir';
  path: string;
}

export interface AddDir {
  action: 'add-dir';
  path: string;
}

export type JsonPacket = WriteFile | AddFile | RemoveFile | RemoveDir | AddDir;
