
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
        .diff([-0.5, 1])
        .normalize(0, 1)
        .getColor(randColor([100, 100, 100]));

    const brick = new SimpleBuffer(256);
    const brickImg = brick
        .brick(5, 10)
        .forBuf(noise, (a, b) => a * b)
        .normalize(0.7, 1)
        .getColor(randColor([160, 54, 35]));

    const brickMask = new SimpleBuffer(256);
    brickMask
        .brickMask(5, 10)
        .gaussian(3)
        .clamp(0.1, 0.3)
        .normalize(0, 1);

    const brickCementImg = brickMask.getColorLerp(brickImg, cementImg);

    const betonNoise = new SimpleBuffer(256);
    betonNoise
        .perlin(5, 0.5)
        .forEach((a) => a * a)
        .diffFree()
        .normalize(0.6, 1);

    const beton = new SimpleBuffer(256);
    const betonImg = beton
        .brick(5, 5)
        .normalize(0.7, 1)
        .forBuf(betonNoise, (a, b) => a * b)
        .getColor(randColor([160, 160, 160]));

    const betonMask = new SimpleBuffer(256);
    betonMask
        .brickMask(5, 5)
        .gaussian(3)
        .clamp(0.1, 0.3)
        .normalize(0, 1);

    const betonCementImg = betonMask.getColorLerp(betonImg, cementImg);

    const water = new SimpleBuffer(256);
    const waterImg = water
        .perlin(2, 0.5)
        .normalize(0, 30)
        .forEach(Math.cos)
        // .forEach(Math.abs)
        // .forEach(Math.sqrt)
        // .diffFree()
        .normalize(0.5, 1)
        .getColor2(randColor([255, 0, 0]), randColor([255, 255, 0]));

    context.drawImage(brickCementImg, 100, 100);
    context.drawImage(betonCementImg, 100 + groundImg.width, 100);
    context.drawImage(waterImg, 100 + groundImg.width * 2, 100);
    context.drawImage(groundImg, 100 + groundImg.width * 3, 100);
}
window.addEventListener("load", main);
