import { resolve } from 'path';

import { parseArgs } from './lib/args';
import { client } from './lib/client';
import { server } from './lib/server';

const args = parseArgs();

function getCurrentDir(): string {
  return '.';
}

function getFilePath(): string {
  if (args._.length > 0) {
    return resolve(args._[0]);
  } else {
    return resolve(getCurrentDir());
  }
}

if (args.server) {
  server({
    filepath: getFilePath(),
    port: args.port,
    host: args.host,
    discovery: args.discovery,
  });
} else {
  client({
    filepath: getFilePath(),
    port: args.port,
    host: args.host,
    discovery: args.discovery,
  });
}
