
import SimpleBuffer from "./gener/buffer";
import { randColor } from "./utils";

function calcSizeMap() {
    let mapWidth = 36;
    let mapHeight = 20;
    mapWidth += 1 + 1; // for board;
    mapHeight += 1 + 1 + 1; // for board and UI
    return { mapWidth, mapHeight };
}

// Size of map 36x20
function calcSizeForCanvas(width, height) {
    const { mapWidth, mapHeight } = calcSizeMap();
    const aspect = width / height;
    const mapAspect = mapWidth / mapHeight;

    if (mapAspect > aspect) {
        return { width, height: width / mapAspect };
    }
    return { width: height * mapAspect, height };
}

function main() {
    console.assert = (condition, message = "Assertion failed") => {
        if (!condition) {
            console.log(message);
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    };

    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const { width, height } = calcSizeForCanvas(window.innerWidth - 40, window.innerHeight - 40);
    canvas.width = width;
    canvas.height = height;

    const noise = new SimpleBuffer(256);
    noise
        .perlin(5, 0.5)
        .normalize(0, 1);

    const ground = new SimpleBuffer(256);
    const groundImg = ground
        .perlin(2, 0.5)
        .diff([-0.5, 1])
        .diff([1, 0.5])
        .normalize(0.75, 1)
        .getColor(randColor([224, 207, 159], 20));

    const cement = new SimpleBuffer(256);
    const cementImg = cement
        .perlin(5, 0.5)
        .diff([1, 0.5])
        .normalize(0, 1)
        .getColor(randColor([100, 100, 100], 10));

    const brick = new SimpleBuffer(256);
    const brickImg = brick
        .brick(5, 10)
        .forBuf(noise, (a, b) => a * b)
        .normalize(0.75, 1)
        .getColor(randColor([160, 54, 35], 10));

    const brickMask = new SimpleBuffer(256);
    brickMask
        .brickMask(5, 10)
        .gaussian(3)
        .clamp(0.1, 0.3)
        .normalize(0, 1);

    const brickCementImg = brickMask.getColorLerp(brickImg, cementImg);

    context.drawImage(brickCementImg, 100, 100);
    context.drawImage(groundImg, 100 + groundImg.width, 100);
    context.drawImage(groundImg, 100 + groundImg.width * 2, 100);
}
window.addEventListener("load", main);
