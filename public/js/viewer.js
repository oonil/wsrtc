console.log("viewerJs");

//stream information to fetch chunks
const userId = "nil";
const streamId = "teststream";
const timestamp = 1636469799;
const chunkIndex = 3;

var mimeCodec = "video/webm;codecs=vp8,opus";

function playStream() {
  //
}

//init streaming
function initStreaming({ userId, streamId, timestamp, chunkIndex }) {
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
        initStreaming({
          userId,
          streamId,
          timestamp,
          chunkIndex,
        });
        res.blob();
      }
    })
    .then((dav) => {
      if (isFirst) {
        playStream();
        isFirst = false;
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
async function run() {
  console.log("----Begin----");
  await initStreaming({
    streamId,
    userId,
    timestamp,
    chunkIndex,
  });
}

run();
