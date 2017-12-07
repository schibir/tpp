
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
        .perlin(5, 0.9)
        .normalize(0.75, 1)
        .getColor(randColor([224, 207, 159]));

    const cement = new SimpleBuffer(256);
    const cementImg = cement
        .perlin(5, 0.5)
        .diff([1, 0.5])
        .diff([-0.5, 1])
        .normalize(0, 1)
        .getColor(randColor([100, 100, 100]));

    const brick = new SimpleBuffer(256);
    const brickImg = brick
        .brick(4, 8)
        .forBuf(noise, (a, b) => a * b)
        .normalize(0.7, 1)
        .getColor(randColor([160, 54, 35]));

    const brickMask = new SimpleBuffer(256);
    brickMask
        .brickMask(4, 8)
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
        .brick(4, 4)
        .normalize(0.7, 1)
        .forBuf(betonNoise, (a, b) => a * b)
        .getColor(randColor([160, 160, 160]));

    const betonMask = new SimpleBuffer(256);
    betonMask
        .brickMask(4, 4)
        .gaussian(3)
        .clamp(0.1, 0.3)
        .normalize(0, 1);

    const betonCementImg = betonMask.getColorLerp(betonImg, cementImg);

    const lava = new SimpleBuffer(256);
    const lavaImg = lava
        .perlin(2, 0.5)
        .normalize(0, 30)
        .forEach(Math.cos)
        .normalize(0.5, 1)
        .getColor2(randColor([255, 0, 0]), randColor([255, 255, 0]));

    // grass
    const grass = new SimpleBuffer(128);
    grass
        .perlin(5, 0.5)
        .diffFree()
        .normalize(0.7, 1.3);

    const normDist = new SimpleBuffer(128);
    normDist
        .normDist(1)
        .normalize(0, 3)
        .clamp(0, 1);

    const grassMask = new SimpleBuffer(128);
    grassMask
        .perlin(20, 0.9)
        .normalize(0, 1)
        .forBuf(normDist, (a, b) => a * b)
        .clamp(0.2, 0.5)
        .normalize(0, 1);

    const grassImg = grass.getColorAlpha(grassMask, randColor([49, 107, 54]));

    const boardMask = new SimpleBuffer(32);
    boardMask
        .forEach(() => 1)
        .bresenham(0, 0, boardMask.size - 1, 0, 0)
        .bresenham(0, boardMask.size - 1, boardMask.size - 1, boardMask.size - 1, 0)
        .bresenham(0, 0, 0, boardMask.size - 1, 0)
        .bresenham(boardMask.size - 1, 0, boardMask.size - 1, boardMask.size - 1, 0)
        .gaussian(2);

    const board = new SimpleBuffer(32);
    const boardImg = board
        .perlin(2, 0.5)
        .normalize(0.7, 1)
        .forBuf(boardMask, (a, b) => a * b)
        .getColor(randColor([188, 198, 204]));

    context.drawImage(brickCementImg, 100, 100);
    context.drawImage(betonCementImg, 100 + groundImg.width, 100);
    context.drawImage(lavaImg, 100 + groundImg.width * 2, 100);
    context.drawImage(groundImg, 100 + groundImg.width * 3, 100);
    context.drawImage(grassImg, 100 + groundImg.width * 3, 100);
    context.drawImage(boardImg, 0, 0, 32, 32, 200 + groundImg.width * 3, 200, 32, 32);
}
window.addEventListener("load", main);
