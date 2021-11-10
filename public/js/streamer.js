console.log("streamerJS");

const streamPlayer = document.getElementById("streamPlayer");
//websocket connection url;
const wsURL = "wss://localhost:8080";
const userMediaInterval = 1000; //1 second

let streamingStarted = false;
//Websocket connection
async function wsConnection() {
  return new Promise((resolve, reject) => {
    ws_connection = new WebSocket(wsURL);
    ws_connection.onopen = () => {
      console.log("connection open");
      resolve(ws_connection);
    };
    ws_connection.onmessage = () => {
      console.log("websocket message event");
    };
  });
}

//return userMediaStreams & play in local player
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
      streamPlayer.srcObject = stream;
      streamPlayer.play();

      //resolve mediastream
      const mediaStream = new MediaRecorder(stream);
      resolve(mediaStream);
    });
  });
}

//send userMediaStream through websockets.
async function sendStreams({ mediaStream, wsConnection, interval }) {
  //extract data from userMedia streams
  mediaStream.ondataavailable = (event) => {
    // blob->arrayBuffer->Uint8Array->Array
    event.data.arrayBuffer().then((dataArrayBuffer) => {
      //?WHY?
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

      wsConnection.send(JSON.stringify(wsMsg));
    });
  };
  // make data available event fire every one second
  mediaStream.start(interval);
}

async function run() {
  console.log("----Begin----");
  //create first websocket connnection
  wsConnection = await wsConnection();

  //gets diffrent resolution streams play in streamPlayer
  mediaStream = await getUserMediaStreams();

  //send stream data through websockets
  await sendStreams({ mediaStream, wsConnection, interval: userMediaInterval });
}

//start streaming
run();
