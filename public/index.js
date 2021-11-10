//getUSerMedia video element
let getUserMediaElement = document.getElementById("getUserMedia");
//wsMediaStream
let wsMediaElement = document.getElementById("wsMedia");

//streamingFlag
let streamingStarted = false;
let chunkIndex = 0;

//Websocket connection
async function wsConnection() {
  return new Promise((resolve, reject) => {
    ws_connection = new WebSocket("wss://localhost:8080/");
    ws_connection.onopen = () => {
      console.log("connection open");
      resolve(ws_connection);
    };
    ws_connection.onmessage = () => {
      console.log("websocket message event");
    };
  });
}

//return stream data
async function getUserMediaStreams() {
  let constraints = {
    audio: true,
    video: { width: 1280, height: 720 },
  };

  var userMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
  return new Promise((resolve, reject) => {
    //get mediaStream
    userMediaPromise.then((stream) => {
      //play locally
      getUserMediaElement.srcObject = stream;
      getUserMediaElement.play();

      //resolve mediastream
      const mediaStream = new MediaRecorder(stream);
      resolve(mediaStream);
    });
  });
}

async function sendStreams({ mediaStream, wsConnection, interval }) {
  console.log(interval);
  mediaStream.ondataavailable = (event) => {
    console.log("event data", event.data);
    console.log("data event");
    //send array buffer.
    // blob->arrayBuffer->Uint8Array->Array
    event.data.arrayBuffer().then((dataArrayBuffer) => {
      //create new arrayBuffer to add our information
      let sendingArray = Array.from(new Uint8Array(dataArrayBuffer));

      //check if it's first chunk
      if (!streamingStarted) {
        streamingStarted = true;
        chunkIndex = 0;
      } else {
        chunkIndex += 1;
      }

      let wsMsg = {
        type: "binary",
        data: sendingArray,
        timestamp: Math.round(new Date().getTime() / 1000), //timestamp
        userId: "nil",
        streamId: "teststream",
        chunkIndex: chunkIndex,
      };

      // wsConnection.send(JSON.stringify(wsMsg));
    });
    // wsConnection.send(event.data);
  };
  // make data available event fire every one second
  mediaStream.start(interval);
}

var blobList = [];
let gCurrentTime = 0;
let isFirst = true;
function startBlobStream() {
  var thisBlob = new Blob(blobList, { type: "video/webm;codecs=vp8,opus" });
  var url = URL.createObjectURL(thisBlob);
  wsMediaElement.src = url;
  wsMediaElement.currentTime = gCurrentTime;
  wsMediaElement.play();
}
function playStream({ userId, streamId, timestamp, chunkIndex }) {
  //default index starts from 0.

  let path = "/chunks/";

  let chunkname = `${streamId}_${userId}_${timestamp}_${chunkIndex}`;
  window
    .fetch(path + chunkname)
    .then((res) => {
      //if response status is 200 then recursive call
      if (res.status == 200) {
        console.log("res", res.body);
        timestamp += 1;
        chunkIndex += 1;
        playStream({
          userId,
          streamId,
          timestamp,
          chunkIndex,
        });
        res.blob();
      }
    })
    .then((dav) => {
      blobList.push(dav);
      if (isFirst) {
        startBlobStream();
        isFirst = false;
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
//run
async function run() {
  console.log("----Begin----");
  //create first websocket connnection
  // wsConnection = await wsConnection();

  //get diffrent resolution streams
  // mediaStream = await getStreams();

  //send streams
  // await sendStreams({ mediaStream, wsConnection, interval: 1 * 1000 });

  await playStream({
    streamId: "teststream",
    userId: "nil",
    timestamp: 1636469799,
    chunkIndex: 3,
  });
}

run();
