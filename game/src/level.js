
import { getMapSize, getTileSize } from "./utils";
import GenTextures from "./gener/genTextures";

const EMPTY = 0;
const HALF = 1;
const BRICK = 2;
const BETON = 4;
const WATER = 8;
const GRASS = 16;
const BRIDGEH = 32;
const BRIDGEV = 64;
const BRIDGE = BRIDGEH | BRIDGEV;
const MOVE_MASK = HALF | BRICK | BETON | WATER;
const BULLET_MASK = HALF | BRICK | BETON;

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
        const { mapWidth, mapHeight } = getMapSize();
        const tileSize = getTileSize(canvas.width, canvas.height);
        console.log(`tileSize = ${tileSize}`);

        this.drawTilesPerFrame = 0;

        this.tileSize = tileSize;
        this.textures = new GenTextures(tileSize);
        this.layerGround = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerBrick = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerGrass = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        const layerLava = new Layer(mapWidth * tileSize, mapHeight * tileSize);

        const renderBoard = () => {
            // render horizontal board
            for (let i = 0; i < mapWidth; i++) {
                this.layerGround.context.drawImage(this.textures.board, i * tileSize, 0);
                this.layerGround.context.drawImage(this.textures.board, i * tileSize,
                    (mapHeight - 1) * tileSize);
            }
            // render vertical board
            for (let i = 1; i < mapHeight - 1; i++) {
                this.layerGround.context.drawImage(this.textures.board, 0, i * tileSize);
                this.layerGround.context.drawImage(this.textures.board, (mapWidth - 1) * tileSize,
                    i * tileSize);
            }
        };
        const renderTexture = (destLayer, texture) => {
            for (let y = 0; y < destLayer.canvas.height; y += texture.height) {
                for (let x = 0; x < destLayer.canvas.width; x += texture.width) {
                    destLayer.context.drawImage(texture, x, y);
                }
            }
        };
        const calcTilePos = (index, minusHalf) => {
            const x = 1 + index % (mapWidth - 2) | 0;
            const y = 1 + index / (mapWidth - 2) | 0;
            let posX = x * tileSize;
            let posY = y * tileSize;
            if (minusHalf) {
                posX -= tileSize / 2 | 0;
                posY -= tileSize / 2 | 0;
            }
            return { posX, posY };
        };
        const renderLava = () => {
            const oldGround = this.layerGround.context.globalCompositeOperation;
            this.layerGround.context.globalCompositeOperation = "multiply";

            this.map.forEach((tile, index) => {
                if (tile & (WATER | BRIDGE)) {
                    const { posX, posY } = calcTilePos(index, true);
                    const ind = Math.random() * this.textures.lavaMask.length | 0;
                    layerLava.context.drawImage(this.textures.lavaMask[ind], posX, posY);
                    this.layerGround.context.drawImage(this.textures.lavaLightMask[ind], posX, posY);
                }
            });

            const oldLava = layerLava.context.globalCompositeOperation;
            layerLava.context.globalCompositeOperation = "source-atop";

            renderTexture(layerLava, this.textures.lava);

            this.layerGround.context.globalCompositeOperation = oldGround;
            layerLava.context.globalCompositeOperation = oldLava;
        };
        const renderBridge = () => {
            this.map.forEach((tile, index) => {
                if (tile & BRIDGE) {
                    const { posX, posY } = calcTilePos(index, true);
                    const ind = Math.random() * this.textures.bridge.length | 0;
                    if (tile === BRIDGEV) {
                        layerLava.context.drawImage(this.textures.bridge[ind], posX, posY);
                    } else {
                        layerLava.context.save();

                        layerLava.context.translate(posX, posY);
                        layerLava.context.rotate(Math.PI * 0.5);
                        layerLava.context.scale(1, -1);
                        layerLava.context.drawImage(this.textures.bridge[ind], 0, 0);

                        layerLava.context.restore();
                    }
                }
            });
        };
        const renderBrick = () => {
            this.map.forEach((tile, index) => {
                if (tile & (BRICK | BETON)) {
                    const { posX, posY } = calcTilePos(index, false);
                    const img = tile & BRICK ? this.textures.brick : this.textures.beton;
                    const srcX = posX % img.width | 0;
                    const srcY = posY % img.height | 0;
                    this.layerBrick.context.drawImage(img,
                        srcX, srcY,
                        tileSize, tileSize,
                        posX, posY,
                        tileSize, tileSize);
                }
            });
        };
        const renderGrass = () => {
            this.map.forEach((tile, index) => {
                if (tile === GRASS) {
                    const { posX, posY } = calcTilePos(index, true);
                    const ind = Math.random() * this.textures.lavaMask.length | 0;
                    this.layerGrass.context.drawImage(this.textures.grassMask[ind], posX, posY);
                }
            });

            const oldGrass = this.layerGrass.context.globalCompositeOperation;
            this.layerGrass.context.globalCompositeOperation = "source-atop";

            renderTexture(this.layerGrass, this.textures.grass);

            this.layerGrass.context.globalCompositeOperation = oldGrass;
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

            renderTexture(this.layerGround, this.textures.ground);
            renderLava();
            renderBridge();
            renderBoard();
            renderBrick();
            renderGrass();

            this.layerGround.context.drawImage(layerLava.canvas, 0, 0);

            this.context = canvas.getContext("2d");
            this.context.drawImage(this.layerGround.canvas, 0, 0);
            this.context.drawImage(this.layerBrick.canvas, 0, 0);
            this.context.drawImage(this.layerGrass.canvas, 0, 0);

            console.log(`Render time = ${Date.now() - renderTime}`);
        });
    }
    ready() {
        return !!this.context;
    }
    update() {
        this.context.fillStyle = "black";
        this.context.fillRect(2 * this.tileSize, this.context.canvas.height - this.tileSize, 2 * this.tileSize, this.tileSize);
        this.context.font = `${this.tileSize * 0.35 | 0}px Verdana, Geneva, Arial, Helvetica, sans-serif`;
        this.context.fillStyle = "white";
        this.context.fillText(`Tiles = ${this.drawTilesPerFrame}`, 2 * this.tileSize, this.context.canvas.height - 10);

        this.drawTilesPerFrame = 0;
    }
    clearEntity(entity) {
        const x = entity.cx + 1 - entity.size * 0.5;    // for board
        const y = entity.cy + 1 - entity.size * 0.5;    // for board
        this.context.drawImage(this.layerGround.canvas,
            x * this.tileSize, y * this.tileSize,                       // src pos
            entity.size * this.tileSize, entity.size * this.tileSize,   // src size
            x * this.tileSize, y * this.tileSize,                       // dest pos
            entity.size * this.tileSize, entity.size * this.tileSize);  // dest size
        this.context.drawImage(this.layerGrass.canvas,
            x * this.tileSize, y * this.tileSize,                       // src pos
            entity.size * this.tileSize, entity.size * this.tileSize,   // src size
            x * this.tileSize, y * this.tileSize,                       // dest pos
            entity.size * this.tileSize, entity.size * this.tileSize);  // dest size

        this.drawTilesPerFrame += entity.size * entity.size * 2;
    }
    drawEntity(entity, texture) {
        const x = entity.cx + 1 - entity.size * 0.5;    // for board
        const y = entity.cy + 1 - entity.size * 0.5;    // for board
        this.context.drawImage(texture,
            0, 0,                                                       // src pos
            entity.size * this.tileSize, entity.size * this.tileSize,   // src size
            x * this.tileSize, y * this.tileSize,                       // dest pos
            entity.size * this.tileSize, entity.size * this.tileSize);  // dest size
        this.context.drawImage(this.layerGrass.canvas,
            x * this.tileSize, y * this.tileSize,                       // src pos
            entity.size * this.tileSize, entity.size * this.tileSize,   // src size
            x * this.tileSize, y * this.tileSize,                       // dest pos
            entity.size * this.tileSize, entity.size * this.tileSize);  // dest size

        this.drawTilesPerFrame += entity.size * entity.size * 2;
    }
}
