
import SimpleBuffer from "./buffer";
import { randColor } from "../utils";

export default class GenTextures {
    constructor(tileSize) {
        const noise = new SimpleBuffer(tileSize * 8);
        noise
            .perlin(5, 0.5)
            .normalize(0, 1);

        // ground
        const ground = new SimpleBuffer(tileSize * 8);
        this.ground = ground
            .perlin(5, 0.9)
            .normalize(0.75, 1)
            .getColor(randColor([224, 207, 159]));

        // brick
        const cement = new SimpleBuffer(tileSize * 8);
        const cementImg = cement
            .perlin(5, 0.5)
            .diff([1, 0.5])
            .diff([-0.5, 1])
            .normalize(0, 1)
            .getColor(randColor([100, 100, 100]));

        const brick = new SimpleBuffer(tileSize * 8);
        const brickImg = brick
            .brick(4, 8)
            .forBuf(noise, (a, b) => a * b)
            .normalize(0.7, 1)
            .getColor(randColor([160, 54, 35]));

        const brickMask = new SimpleBuffer(tileSize * 8);
        this.brick = brickMask
            .brickMask(4, 8)
            .gaussian(3)
            .clamp(0.1, 0.3)
            .normalize(0, 1)
            .getColorLerp(brickImg, cementImg);

        // beton
        const betonNoise = new SimpleBuffer(tileSize * 8);
        betonNoise
            .perlin(5, 0.5)
            .forEach((a) => a * a)
            .diffFree()
            .normalize(0.6, 1);

        const beton = new SimpleBuffer(tileSize * 8);
        const betonImg = beton
            .brick(4, 4)
            .normalize(0.7, 1)
            .forBuf(betonNoise, (a, b) => a * b)
            .getColor(randColor([160, 160, 160]));

        const betonMask = new SimpleBuffer(tileSize * 8);
        this.beton = betonMask
            .brickMask(4, 4)
            .gaussian(3)
            .clamp(0.1, 0.3)
            .normalize(0, 1)
            .getColorLerp(betonImg, cementImg);

        // lava
        const lava = new SimpleBuffer(tileSize * 8);
        this.lava = lava
            .perlin(2, 0.5)
            .normalize(0, 30)
            .forEach(Math.cos)
            .normalize(0.5, 1)
            .getColor2(randColor([255, 0, 0]), randColor([255, 255, 0]));

        // grass
        const grass = new SimpleBuffer(tileSize * 8);
        grass
            .perlin(5, 0.5)
            .diffFree()
            .normalize(0.7, 1.3);

        const grassMask = new SimpleBuffer(tileSize * 8);
        this.grass = grassMask
            .perlin(20, 0.9)
            .normalize(0, 1)
            .clamp(0.2, 0.5)
            .normalize(0, 1)
            .getColorAlpha(grassMask, randColor([49, 107, 54]));

        // board
        const boardMask = new SimpleBuffer(tileSize);
        boardMask
            .forEach(() => 1)
            .bresenham(0, 0, boardMask.size - 1, 0, 0)
            .bresenham(0, boardMask.size - 1, boardMask.size - 1, boardMask.size - 1, 0)
            .bresenham(0, 0, 0, boardMask.size - 1, 0)
            .bresenham(boardMask.size - 1, 0, boardMask.size - 1, boardMask.size - 1, 0)
            .gaussian(2);

        const board = new SimpleBuffer(tileSize);
        this.board = board
            .perlin(2, 0.5)
            .normalize(0.7, 1)
            .forBuf(boardMask, (a, b) => a * b)
            .getColor(randColor([188, 198, 204]));
    }
}