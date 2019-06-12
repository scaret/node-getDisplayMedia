const EventEmitter = require('wolfy87-eventemitter');
const path = require('path');
const os = require("os");
const childProcess = require('child_process');
const fsPromises = require("fs").promises;
const PNGInfo = require("png-info");

const tmpdir = os.tmpdir();

const createDarwinCapturer = function (options){
    const self = new EventEmitter();

    self.state = "UNINIT";
    self.frameRate = options.frameRate || null;
    self.width = options.width || null;
    self.height = options.height || null;
    self.monitorId = isFinite(options.monitorId) ? options.monitorId : 1;

    self.start = function(){
        self.state = "RUNNING";
        self.captureRecursive();
    };

    self.stop = function(){
        self.state = "STOPPED";
    };

    self.captureRecursive = async function(){
        var start = Date.now();
        const frame = await self.capture();
        var spent = Date.now() - start;
        if (self.state === "RUNNING"){
            self.emit("frame", frame);
            if (self.frameRate){
                var timeout = (1000 / self.frameRate - spent);
                setTimeout(self.captureRecursive, timeout);
            }else{
                self.captureRecursive();
            }
        }
    };

    self.capture = async function(){
        var cmd = "screencapture";
        var format = "png";
        var filePath = tmpdir;
        var pngFilename = path.join(filePath, `${self.width}x${self.height}_${self.monitorId}.${format}`);
        var args = [
            "-t",
            format,
            "-x",
            pngFilename,
        ];
        if (self.monitorId === 1){
            // do nothing
        }
        else if (self.monitorId){
            args = ["-D", self.monitorId].concat(args);
        }else{
            args = ["-b"].concat(args);
        }

        return new Promise((resolve, reject)=>{
            var captureChild = childProcess.spawn(cmd, args);
            // console.log(`${cmd} ${args.join(" ")}`);

            captureChild.on('close', async function(error) {
                if (error){
                    console.error(error);
                    reject(error);
                }else{
                    var pngFile = await fsPromises.readFile(pngFilename);
                    var pngInfo = new PNGInfo(pngFile);
                    var dimensions = pngInfo.getDimensions();
                    // console.log("dimensions", dimensions);
                    var format = "yuv";
                    var yuvFilename = path.join(filePath, `${dimensions.width}x${dimensions.height}_${self.monitorId}.${format}`);

                    var cmd = "ffmpeg";
                    var args = [
                        "-i",
                        pngFilename,
                        "-pix_fmt",
                        "yuv420p",
                        yuvFilename,
                        "-y",
                    ];

                    var captureChild2 = childProcess.spawn(cmd, args);
                    // console.log(`${cmd} ${args.join(" ")}`);
                    captureChild2.on('close', async function(error){
                        if (error){
                            console.error(error);
                            reject(error);
                        }else{
                            var data = await fsPromises.readFile(yuvFilename);
                            // console.log(`Data`, data.length, data);
                            resolve({
                                width: dimensions.width,
                                height: dimensions.height,
                                data: data
                            });
                        }
                    });
                }
            });
        });

    };

    return self;
};

module.exports = createDarwinCapturer;

// capturer = createDarwinCapturer({});
// capturer.start();
// capturer.on("frame", function(frame){
//     console.log(Date.now() % 1000, "frame", frame);
// })