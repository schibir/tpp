
import { getSizeMap } from "./utils";
import GenTextures from "./gener/genTextures";

class Layer {
    constructor(width, height) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext("2d");
    }
}

export default class Level {
    constructor(levelName, canvas) {
        const { mapWidth, mapHeight } = getSizeMap();
        const tileWidth = canvas.width / mapWidth | 0;
        const tileHeight = canvas.height / mapHeight | 0;
        const tileSize = Math.min(tileWidth, tileHeight);
        console.log(`tileWidth = ${tileWidth}, tileHeight = ${tileHeight}`);

        this.textures = new GenTextures(tileSize);
        this.layerGround = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerBrick = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerGrass = new Layer(mapWidth * tileSize, mapHeight * tileSize);

        const renderBoard = () => {
            for (let i = 0; i < mapWidth; i++) {
                this.layerGround.context.drawImage(this.textures.board, i * tileSize, 0);
                this.layerGround.context.drawImage(this.textures.board, i * tileSize,
                    (mapHeight - 1) * tileSize);
            }
            for (let i = 1; i < mapHeight - 1; i++) {
                this.layerGround.context.drawImage(this.textures.board, 0, i * tileSize);
                this.layerGround.context.drawImage(this.textures.board, (mapWidth - 1) * tileSize,
                    i * tileSize);
            }
        };
        const renderGround = () => {
            const { ground } = this.textures;
            for (let y = 0; y < this.layerGround.canvas.height; y += ground.height) {
                for (let x = 0; x < this.layerGround.canvas.width; x += ground.width) {
                    this.layerGround.context.drawImage(ground, x, y);
                }
            }
        };
        const renderEagle = () => {
            this.layerGround.context.drawImage(this.textures.eagle, 100, 100);
        };

        const renderTime = Date.now();

        renderGround();
        renderBoard();
        renderEagle();

        this.context = canvas.getContext("2d");
        this.context.drawImage(this.layerGround.canvas, 0, 0);

        console.log(`Render time = ${Date.now() - renderTime}`);
    }
}
