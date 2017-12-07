
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
    constructor(levelName, width, height) {
        const { mapWidth, mapHeight } = getSizeMap();
        const tileWidth = width / mapWidth | 0;
        const tileHeight = height / mapHeight | 0;
        const tileSize = Math.min(tileWidth, tileHeight);

        this.textures = new GenTextures(tileSize);
        this.layerGround = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerBrick = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerGrass = new Layer(mapWidth * tileSize, mapHeight * tileSize);
    }
}
