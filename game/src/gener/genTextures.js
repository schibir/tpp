
import SimpleBuffer from "./buffer";
import { randColor } from "../utils";

export default class GenTextures {
    constructor(tileSize) {
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

        const noise = new SimpleBuffer(tileSize * 8);
        noise
            .perlin(5, 0.5)
            .diff([1, 0.5])
            .normalize(0, 1);

        const brick = new SimpleBuffer(tileSize * 8);
        const brickImg = brick
            .brick(8, 16)
            .forBuf(noise, (a, b) => a * b)
            .normalize(0.7, 1)
            .getColor(randColor([200, 80, 60]));

        const brickMask = new SimpleBuffer(tileSize * 8);
        this.brick = brickMask
            .brickMask(8, 16)
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
            .perlin(10, 0.5)
            .normalize(0, 30)
            .forEach(Math.cos)
            .normalize(0.5, 1)
            .getColor2(randColor([255, 0, 0]), randColor([255, 255, 0]));

        this.lavaMask = new Array(8);
        this.lavaLightMask = new Array(8);
        for (let i = 0; i < this.lavaMask.length; i++) {
            const lavaNoise = new SimpleBuffer(tileSize * 2);
            lavaNoise.perlin(5, 0.5);

            const lavaMask = new SimpleBuffer(tileSize * 2);
            this.lavaMask[i] = lavaMask
                .normSquare(0.4, 0.5)
                .normalize(0, 1)
                .forBuf(lavaNoise, (a, b) => a + 0.25 * b)
                .clamp(0.4, 0.6)
                .normalize(0, 1)
                .getColor([255, 255, 255], lavaMask);

            const lavaLightMask = new SimpleBuffer(tileSize * 2);
            this.lavaLightMask[i] = lavaLightMask
                .normSquare(0.4, 0.5)
                .normalize(0, 1.5)
                .forBuf(lavaNoise, (a, b) => a + 0.25 * b)
                .clamp(0.25, 0.75)
                .gaussian(7)
                .normalize(0, 1)
                .getColor([255, 255, 255], lavaLightMask);
        }

        // grass
        const grass = new SimpleBuffer(tileSize * 8);
        this.grass = grass
            .perlin(5, 0.5)
            .diffFree()
            .normalize(0.7, 1.3)
            .getColor(randColor([49, 107, 54]));

        this.grassMask = new Array(8);
        for (let i = 0; i < this.grassMask.length; i++) {
            const normDist = new SimpleBuffer(tileSize * 2);
            normDist
                .normDist(1.25)
                .normalize(0, 3)
                .clamp(0, 1);

            const grassMask = new SimpleBuffer(tileSize * 2);
            this.grassMask[i] = grassMask
                .perlin(20, 0.9)
                .normalize(0, 1)
                .forBuf(normDist, (a, b) => a * b)
                .clamp(0.2, 0.5)
                .normalize(0, 1)
                .getColor(randColor([255, 255, 255]), grassMask);
        }

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

        // Eagle
        const eagle = new SimpleBuffer(tileSize * 2);
        const center = eagle.size * 0.5 | 0;
        const step = eagle.size * 0.1 | 0;
        eagle
            .bresenham(center, center + step, 2 * step, 2 * step, 1)
            .bresenham(center, center + step, eagle.size - 2 * step, 2 * step, 1)
            .bresenham(center, step, center, eagle.size - step, 1)
            .bresenham(center - 2 * step, center + 2 * step, 3 * step, 3 * step, 1)
            .bresenham(center + 2 * step, center + 2 * step, eagle.size - 3 * step, 3 * step, 1)
            .bresenham(center - 2 * step, center + 2 * step, center, center, 1)
            .bresenham(center + 2 * step, center + 2 * step, center, center, 1)
            .gaussian(step)
            .normalize(0, 1)
            .bresenham(center, eagle.size - 2 * step, center - 2 * step, eagle.size - step, 1.5)
            .bresenham(center, eagle.size - 2 * step, center + 2 * step, eagle.size - step, 1.5)
            .bresenham(center, step, center + step * 2, step, 1)
            .bresenham(step * 2, step * 2, step, step, 1.5)
            .bresenham(eagle.size - step * 2, step * 2, eagle.size - step, step, 1.5)
            .bresenham(3 * step, 3 * step, step, 3 * step, 1)
            .bresenham(eagle.size - 3 * step, 3 * step, eagle.size - step, 3 * step, 1)
            .bresenham(4 * step, 4 * step, step, 4 * step, 1)
            .bresenham(eagle.size - 4 * step, 4 * step, eagle.size - step, 4 * step, 1)
            .gaussian(step)
            .normalize(0, 1);

        const eagleMask = new SimpleBuffer(tileSize * 2);
        eagleMask
            .copy(eagle)
            .clamp(0.1, 0.2)
            .normalize(0, 1);

        const eagleColor = new SimpleBuffer(tileSize * 2);
        this.eagle = eagleColor
            .forEach(() => 1)
            .bresenham(center, step, center, step, 0)
            .gaussian(step)
            .normalize(0, 1)
            .clamp(0.2, 0.25)
            .normalize(0, 1)
            .forBuf(eagleMask, (a, b) => a * (5 * (Math.abs(b - 0.5) - 0.5) + 1))
            .forBuf(eagle, (a, b) => a + b * 0.5)
            .getColor2([0, 0, 0], [128, 128, 128], eagleMask);
    }
}
