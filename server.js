const https = require("https");
const fs = require("fs");
const path = require("path");
const ws = require("ws");
const express = require("express");
const expressApp = express();

//server static files
expressApp.use(express.static("public"));

const server = https.createServer(
  {
    cert: fs.readFileSync("./certs/fullchain.pem"),
    key: fs.readFileSync("./certs/privkey.pem"),
  },
  expressApp
);

const wss = new ws.WebSocketServer({ server });

//write to file system
function writeToFileSystem({ chunk, chunkName }) {
  //
  blobToWrite = new Buffer.from(chunk);
  //blob to write
  fileName = path.join(__dirname, "public", "chunks/") + chunkName;

  // fs.writeFile(fileName, blobToWrite, (error) => {
  //   if (error) {
  //     console.log("ERROR", error);
  //   }
  //   console.log("WRITTEN CHUNK");
  // });
  console.log(blobToWrite.length, "blobToWrite.size");
}

//parse Message and create chunk and chunkName
function handleWsMessage(message) {
  let msgObj = JSON.parse(message);
  let chunkName = `${msgObj.streamId}_${msgObj.userId}_${msgObj.timestamp}_${msgObj.chunkIndex}`;
  writeToFileSystem({ chunk: msgObj.data, chunkName: chunkName });
}

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log(message.length);
    handleWsMessage(message);
    // console.log("received: %s", message);
  });

  ws.send(JSON.stringify({ msg: "hello" }));
});

server.listen(8080, () => {
  console.log("SERVER LISTENING ON PORT 8080");
});

//? https://developer.mozilla.org/en-US/docs/Web/API/MediaSource
