// let opencvPlane = document.getElementById('opencv');
// let inputVideo = document.getElementById('inputVideo');
// let cvOutput = document.getElementById('canvasOutput')

// color picker
// let colorPicker = document.getElementById('color-picker');
// colorPicker.value = '#FFFFFF'
// window.color = '#FFFFFF';
// colorPicker.addEventListener('change', e => {
//     // console.log(e.target.value);
//     window.color = e.target.value;
// });

// let newSelect = false;
let src;
let dst;
export let objCen = {x:100, y:100};
// let cap;
// let low;
// let high;
// let lastX;
// let lastY;


// // add listener: the handler would set clicked color for opencv mask & filtering
// cvOutput.addEventListener("click", (e) => {
//     // get color by coordinate, note that this has to be src[y,x] not src[x,y]
//     let color = src.ucharPtr(e.layerY, e.layerX);

//     // threshold for mask
//     let range = 15;

//     // get upper bound and lower bound
//     let color_low = [];
//     let color_high = [];
//     for (let i = 0; i < color.length - 1; i++) {

//         if (color_low[i] - range < 0) {
//             color_low.push(0);
//         }
//         else {
//             color_low.push(color[i] - range);
//         }
//         if (color_high[i] + range > 255) {
//             color_high.push(255);
//         }
//         else {
//             color_high.push(color[i] + range);
//         }
//     }
//     color_low.push(255);
//     color_high.push(255);



//     low = new cv.Mat(src.rows, src.cols, src.type(), color_low);
//     high = new cv.Mat(src.rows, src.cols, src.type(), color_high);

//     if (!newSelect) {
//         newSelect = true;
//     }
// });

export function colorTrack(imgCanvas)
{
    let color =  { id: 0, low: [180, 20, 40, 255], high: [210, 40, 60, 255] } // red
    
    // let stream = arCanvas.captureStream(25)
    // console.log(inputVideo)
    // console.log(arCanvas)
    // console.log(stream)
    // get video stream
    // inputVideo.srcObject = stream;
    // inputVideo.play();

    // console.log(cv)

    // src = copy of video frame
    // src = new cv.Mat(180, 320, cv.CV_8UC4);
    // dst = store the processed frame
    // dst = new cv.Mat(180, 320, cv.CV_8UC4);

    // cap = new cv.VideoCapture(inputVideo);

    const FPS = 30;

    function processVideo() {
        try {
            // for timing
            // let begin = Date.now();
            // start processing.
            // cap.read(src);
            // let canvas = document.getElementById("cameraFeed");
            // let ctx = canvas.getContext('2d');
            // let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // src = cv.matFromImageData(imgData)



            let ctx = imgCanvas.getContext('2d');
            let imgData = ctx.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
            src = cv.matFromImageData(imgData)
            dst = cv.matFromImageData(imgData);
            // console.log(src)

            // src = cv.imread("offscreenraw");


            // let canvas2 = document.getElementById("canvasOutput");
            // let ctx2 = canvas.getContext('2d');
            // let imgData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // dst = cv.matFromImageData(imgData2)



            // cv.cvtColor(src, src, cv.COLOR_RGBA2);

            // if lower bound and upper bound are set
            // if (low && high) {
                // filter out contours
                let lower = new cv.Mat(src.rows, src.cols, src.type(), color.low)
                let higher = new cv.Mat(src.rows, src.cols, src.type(), color.high)
                cv.inRange(src, lower, higher, dst);

                let contours = new cv.MatVector();
                let hierarchy = new cv.Mat();
                // get remaining contours and hierachy
                cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

                // find the largest are of contours
                let maxArea = 0;
                let maxCnt = null;

                for (let i = 0; i < contours.size(); i++) {
                    let cnt = contours.get(i);
                    let area = cv.contourArea(cnt, false);

                    if (area > maxArea) {
                        maxArea = area
                        maxCnt = cnt
                    }
                    // area.delete()
                }

                // if there is a contour exist in the frame, draw
                if (maxCnt && maxCnt.data32S) {
                    let allPoints = maxCnt.data32S;
                    let sumX = 0;
                    let sumY = 0;
                    let numPoints = allPoints.length / 2;
                    for (let i = 0; i < allPoints.length; i += 2) {
                        sumX += allPoints[i];
                        sumY += allPoints[i + 1];
                    }
                    objCen.x = Math.floor(sumX / numPoints) / (imgCanvas.width / 2) - 1;
                    objCen.y = -(Math.floor(sumY / numPoints) / (imgCanvas.height / 2) - 1);
                    console.log(Math.floor(sumY / numPoints) + " " + (imgCanvas.height / 2) + " " + objCen.y)

                    let toDraw = new cv.MatVector();
                    toDraw.push_back(maxCnt);
                    let colorC = new cv.Scalar(0, 255, 0);
                    let hierarchy2 = new cv.Mat();

                    for (let i = 0; i < toDraw.size(); ++i) {
                        cv.drawContours(dst, toDraw, i, colorC, 15, cv.LINE_8, hierarchy2, 0);
                    }
                    // allPoints.delete()
                    toDraw.delete()
                    // colorC.delete()
                    hierarchy2.delete()
                }
                else {
                }

            // }

            cv.imshow("canvasOutput", dst);
            src.delete();
            dst.delete();
            // maxCnt.delete()
            lower.delete();
            higher.delete()
            contours.delete()
            hierarchy.delete()
            
            // schedule the next one.
            // let delay = 1000 / FPS - (Date.now() - begin);
            // setTimeout(processVideo, delay);
        } catch (err) {
            console.error("this is error" + err);
        }
    }

    // schedule the first one.
    setTimeout(processVideo, 0);

}