import rimraf from 'rimraf';

export function rmrf(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    rimraf(path, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
