# node-getDisplayMedia

Supports:

- OSX

```JavaScript
const getDisplayMedia = require("getdisplaymedia");
getDisplayMedia().then((ms)=>{
    ms.getVideoTracks().forEach((track, index){
        console.log(`Track ${index}, kind ${track.kind}, id ${track.id}`)
    });
});
```