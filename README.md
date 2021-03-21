# nsync2

This tool helps me to sync files in real-time.

It highly relies on node stream api.


## Usage

Server (sender):

```bash
cd "some dir which needs to be synced"
node -s build/main/index.js .
```

Client (receiver):

```bash
cd "some dir which needs to be synced"
node build/main/index.js .
```

The server will send commands to client on changes in server directory.


## What needs to be done
* Check whether all files are synced on client connection.
