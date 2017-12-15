
import { getMapSize, getTileSize } from "./utils";
import GenTextures from "./gener/genTextures";

const EMPTY = 0;
const HALF = 1;
const BRICK = 2;
const BETON = 4;
const WATER = 8;
const GRASS = 16;
const PREGRASS = 32;    // adjacent for grass
const BRIDGEH = 64;
const BRIDGEV = 128;
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
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board
        this.textures = new GenTextures(tileSize);
        this.layer = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerGrass = new Layer(mapWidth * tileSize, mapHeight * tileSize);

        const layerGround = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        const layerBrick = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        const layerLava = new Layer(mapWidth * tileSize, mapHeight * tileSize);

        const renderBoard = () => {
            // render horizontal board
            for (let i = 0; i < mapWidth; i++) {
                layerGround.context.drawImage(this.textures.board, i * tileSize, 0);
                layerGround.context.drawImage(this.textures.board, i * tileSize,
                    (mapHeight - 1) * tileSize);
            }
            // render vertical board
            for (let i = 1; i < mapHeight - 1; i++) {
                layerGround.context.drawImage(this.textures.board, 0, i * tileSize);
                layerGround.context.drawImage(this.textures.board, (mapWidth - 1) * tileSize,
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
            const oldGround = layerGround.context.globalCompositeOperation;
            layerGround.context.globalCompositeOperation = "multiply";

            this.map.forEach((tile, index) => {
                if (tile & (WATER | BRIDGE)) {
                    const { posX, posY } = calcTilePos(index, true);
                    const ind = Math.random() * this.textures.lavaMask.length | 0;
                    layerLava.context.drawImage(this.textures.lavaMask[ind], posX, posY);
                    layerGround.context.drawImage(this.textures.lavaLightMask[ind], posX, posY);
                }
            });

            const oldLava = layerLava.context.globalCompositeOperation;
            layerLava.context.globalCompositeOperation = "source-atop";

            renderTexture(layerLava, this.textures.lava);

            layerGround.context.globalCompositeOperation = oldGround;
            layerLava.context.globalCompositeOperation = oldLava;
        };
        const renderBridge = () => {
            this.map.forEach((tile, index) => {
                if (tile & BRIDGE) {
                    const { posX, posY } = calcTilePos(index, true);
                    const ind = Math.random() * this.textures.bridgeV.length | 0;
                    if (tile & BRIDGEV) {
                        layerLava.context.drawImage(this.textures.bridgeV[ind], posX, posY);
                    } else {
                        layerLava.context.drawImage(this.textures.bridgeH[ind], posX, posY);
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
                    layerBrick.context.drawImage(img,
                        srcX, srcY,
                        tileSize, tileSize,
                        posX, posY,
                        tileSize, tileSize);
                }
            });
        };
        const renderGrass = () => {
            this.map.forEach((tile, index) => {
                if (tile & GRASS) {
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
                console.assert(attrs.width.textContent === `${this.mapWidth}`);
                console.assert(attrs.height.textContent === `${this.mapHeight}`);
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
                console.assert(data.length === this.mapWidth * this.mapHeight, "Wrong count tiles");

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

                // calc adjacent grass
                for (let j = 0; j < this.mapHeight; j++) {
                    for (let i = 0; i < this.mapWidth; i++) {
                        for (let dy = -1; dy < 2; dy++) {
                            for (let dx = -1; dx < 2; dx++) {
                                const x = i + dx | 0;
                                const y = j + dy | 0;
                                if (x >= 0 &&
                                    x < this.mapWidth &&
                                    y >= 0 &&
                                    y < this.mapHeight &&
                                    this.map[y * this.mapWidth + x] & GRASS) {
                                    this.map[j * this.mapWidth + i] |= PREGRASS;
                                }
                            }
                        }
                    }
                }

                callback();
            };
            reader.onerror = () => console.assert(false, `Couldn't load ${levelName}.tmx`);
            reader.send();
        };

        loadLevel(() => {
            const renderTime = Date.now();

            renderTexture(layerGround, this.textures.ground);
            renderLava();
            renderBridge();
            renderBoard();
            renderBrick();
            renderGrass();

            this.layer.context.drawImage(layerGround.canvas, 0, 0);
            this.layer.context.drawImage(layerLava.canvas, 0, 0);
            this.layer.context.drawImage(layerBrick.canvas, 0, 0);
            this.layer.context.drawImage(this.layerGrass.canvas, 0, 0);

            this.context = canvas.getContext("2d");
            this.context.drawImage(this.layer.canvas, 0, 0);

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
    drawTile(texture, srcx, srcy, dstx, dsty, size) {
        this.context.drawImage(texture,
            srcx * this.tileSize, srcy * this.tileSize,
            size * this.tileSize, size * this.tileSize,
            dstx * this.tileSize, dsty * this.tileSize,
            size * this.tileSize, size * this.tileSize);
        this.drawTilesPerFrame += size * size;
    }
    clearEntity(entity) {
        const x = entity.cx + 1 - entity.size * 0.5;    // for board
        const y = entity.cy + 1 - entity.size * 0.5;    // for board
        this.drawTile(this.layer.canvas, x, y, x, y, entity.size);
    }
    drawEntityBegin(entity, texture) {
        const x = entity.cx + 1 - entity.size * 0.5;    // for board
        const y = entity.cy + 1 - entity.size * 0.5;    // for board
        this.drawTile(texture, 0, 0, x, y, entity.size);
    }
    drawEntityEnd(entity) {
        if (this.collidePoint(entity.cx, entity.cy, PREGRASS | GRASS)) {
            const x = entity.cx + 1 - entity.size * 0.5;    // for board
            const y = entity.cy + 1 - entity.size * 0.5;    // for board
            this.drawTile(this.layerGrass.canvas, x, y, x, y, entity.size);
        }
    }
    drawEntity(entity, texture) {
        this.drawEntityBegin(entity, texture);
        this.drawEntityEnd(entity);
    }
    collidePoint(x, y, mask) {
        if (mask & MOVE_MASK && (
            x < 0 || x >= this.mapWidth ||
            y < 0 || y >= this.mapHeight)) return true;

        const ix = x | 0;
        const iy = y | 0;
        const ind = iy * this.mapWidth + ix;
        return !!(this.map[ind] & mask);
    }
    collideEntity(entity, offset, mask) {
        const sina = [-1, 0, 1, 0];
        const cosa = [0, 1, 0, -1];
        const x = entity.cx + cosa[entity.angle] * offset * entity.size;
        const y = entity.cy + sina[entity.angle] * offset * entity.size;
        const x1 = x + cosa[entity.angle + 1 & 3] * 0.5;
        const y1 = y + sina[entity.angle + 1 & 3] * 0.5;
        const x2 = x - cosa[entity.angle + 1 & 3] * 0.5;
        const y2 = y - sina[entity.angle + 1 & 3] * 0.5;

        return this.collidePoint(x1, y1, mask) || this.collidePoint(x2, y2, mask);
    }
    collideTank(entity) {
        return this.collideEntity(entity, 0.5, MOVE_MASK);
    }
    collideBullet(entity) {
        return this.collideEntity(entity, 0, BULLET_MASK);
    }
}
