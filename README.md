# node-getDisplayMedia

Supports:

- OSX

```JavaScript
const wrtc = require("wrtc");
const getDisplayMedia = require("getdisplaymedia")(wrtc);
getDisplayMedia().then((ms)=>{
    ms.getVideoTracks().forEach((track, index){
        console.log(`Track ${index}, kind ${track.kind}, id ${track.id}`)
    });
});
```