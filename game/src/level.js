
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

const EMPTY = 0;
const HALF = 1;
const BRICK = 2;
const BETON = 4;
const WATER = 8;
const GRASS = 16;
const BRIDGEH = 32;
const BRIDGEV = 64;
const BRIDGE = BRIDGEH | BRIDGEV;
const EAGLE = 128;
const MOVE_MASK = HALF | BRICK | BETON | WATER | EAGLE;
const BULLET_MASK = HALF | BRICK | BETON | EAGLE;

export const TileType = {
    EMPTY,
    HALF,
    BRICK,
    BETON,
    WATER,
    GRASS,
    BRIDGEH,
    BRIDGEV,
    BRIDGE,
    EAGLE,
    MOVE_MASK,
    BULLET_MASK,
};

export class Level {
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
            const posX = ((mapWidth / 2 | 0) - 1) * tileSize;
            const posY = (mapHeight - 3) * tileSize;
            this.layerGround.context.drawImage(this.textures.eagle, posX, posY);
        };
        const loadLevel = (callback) => {
            console.log(`Loading ${levelName}.tmx level`);
            const reader = new XMLHttpRequest();
            reader.open("get", `${levelName}.tmx`, true);
            reader.onload = () => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(reader.responseText, "text/xml");

                console.assert(xml.children.length === 1, "Count children must bu 1");

                const attrs = xml.children[0].attributes;
                console.assert(attrs.width.textContent === `${mapWidth - 2}`);
                console.assert(attrs.height.textContent === `${mapHeight - 2}`);
                console.assert(xml.children[0].children.length === 2, "Should be tileset and layer");
                console.assert(xml.children[0].children[1].children.length === 1, "Should be data");

                const data = xml
                    .children[0]
                    .children[1]
                    .children[0]
                    .innerHTML
                    .split(/\s|,/)
                    .filter((val) => val !== "")
                    .map((val) => parseInt(val, 10));
                console.assert(data.length === (mapWidth - 2) * (mapHeight - 2), "Wrong count tiles");

                this.map = data.map((val) => {
                    switch (val) {
                    case 0: return EMPTY;
                    case 1: return BRICK;
                    case 2: return BETON;
                    case 3: return WATER;
                    case 4: return GRASS;
                    case 5: return BRIDGEH;
                    case 6: return BRIDGEV;
                    default:
                        return console.assert(false, `Unknown tile type ${val}`);
                    }
                });

                callback();
            };
            reader.onerror = () => console.assert(false, `Couldn't load ${levelName}.tmx`);
            reader.send();
        };

        loadLevel(() => {
            const renderTime = Date.now();

            renderGround();
            renderBoard();
            renderEagle();

            this.context = canvas.getContext("2d");
            this.context.drawImage(this.layerGround.canvas, 0, 0);

            console.log(`Render time = ${Date.now() - renderTime}`);
        });
    }
}
