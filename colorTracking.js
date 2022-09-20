let opencvPlane = document.getElementById('opencv');
let inputVideo = document.getElementById('inputVideo');
let cvOutput = document.getElementById('canvasOutput')

// color picker
let colorPicker = document.getElementById('color-picker');
colorPicker.value = '#FFFFFF'
window.color = '#FFFFFF';
colorPicker.addEventListener('change', e => {
    // console.log(e.target.value);
    window.color = e.target.value;
});

let newSelect = false;
let src;
let dst;
let cap;
let low;
let high;
let lastX;
let lastY;


// add listener: the handler would set clicked color for opencv mask & filtering
cvOutput.addEventListener("click", (e) => {
    // get color by coordinate, note that this has to be src[y,x] not src[x,y]
    let color = src.ucharPtr(e.layerY, e.layerX);

    // threshold for mask
    let range = 15;

    // get upper bound and lower bound
    let color_low = [];
    let color_high = [];
    for (let i = 0; i < color.length - 1; i++) {

        if (color_low[i] - range < 0) {
            color_low.push(0);
        }
        else {
            color_low.push(color[i] - range);
        }
        if (color_high[i] + range > 255) {
            color_high.push(255);
        }
        else {
            color_high.push(color[i] + range);
        }
    }
    color_low.push(255);
    color_high.push(255);



    low = new cv.Mat(src.rows, src.cols, src.type(), color_low);
    high = new cv.Mat(src.rows, src.cols, src.type(), color_high);

    if (!newSelect) {
        newSelect = true;
    }
});

colorTrack()
export function colorTrack()
{
    
    let stream = arCanvas.captureStream(25)
    // console.log(inputVideo)
    // console.log(arCanvas)
    // console.log(stream)
    // get video stream
    inputVideo.srcObject = stream;
    inputVideo.play();

    console.log(cv)

    // src = copy of video frame
    src = new cv.Mat(180, 320, cv.CV_8UC4);
    // dst = store the processed frame
    dst = new cv.Mat(180, 320, cv.CV_8UC4);

    cap = new cv.VideoCapture(inputVideo);

    const FPS = 30;

    function processVideo() {
        try {
            // for timing
            let begin = Date.now();
            // start processing.
            cap.read(src);
            // cv.cvtColor(src, src, cv.COLOR_RGBA2);

            // if lower bound and upper bound are set
            if (low && high) {
                // filter out contours
                cv.inRange(src, low, high, dst);

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

                    
                }
                else {
                }

            }

            cv.imshow("canvasOutput", src);
            // schedule the next one.
            let delay = 1000 / FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);
        } catch (err) {
            console.error(err);
        }
    }

    // schedule the first one.
    setTimeout(processVideo, 0);

}