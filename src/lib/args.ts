import getopts from 'getopts';

export function parseArgs() {
  return getopts(process.argv.slice(2), {
    alias: {
      server: ['s'],
      host: ['h'],
      port: ['p'],
      discovery: ['d'],
    },
    boolean: ['s', 'd'],
    default: {
      host: '0.0.0.0',
      port: 4255,
      discovery: true
    },
  });
}
