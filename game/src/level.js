
import { getMapSize, getTileSize, sin, cos } from "./utils";
import GenTextures from "./gener/genTextures";
import { PART } from "./global";

const EMPTY = 1;
const HALF = 2;
const BRICK = 4;
const BETON = 8;
const WATER = 16;
const GRASS = 32;
const PREGRASS = 64;    // adjacent for grass
const BRIDGEH = 128;
const BRIDGEV = 256;
const BRIDGE = BRIDGEH | BRIDGEV;
const MOVE_MASK = HALF | BRICK | BETON | WATER;
const BULLET_MASK = HALF | BRICK | BETON;

export class Layer {
    constructor(width, height) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext("2d");
    }
}

export class Level {
    constructor(levelName, canvas, event) {
        const { mapWidth, mapHeight } = getMapSize();
        const tileSize = getTileSize(canvas.width, canvas.height);
        console.log(`tileSize = ${tileSize}`);

        this.event = event;
        this.tileSize = tileSize;
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board
        this.textures = new GenTextures(tileSize);
        this.layer = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layer0 = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layer1 = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        this.layerGrass = new Layer(mapWidth * tileSize, mapHeight * tileSize);

        const layerGround = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        const layerBrick = new Layer(mapWidth * tileSize, mapHeight * tileSize);
        const layerHalf = new Layer(mapWidth * tileSize, mapHeight * tileSize);
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
                if (tile.type & (WATER | BRIDGE)) {
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
                if (tile.type & BRIDGE) {
                    const { posX, posY } = calcTilePos(index, true);
                    const ind = Math.random() * this.textures.bridgeV.length | 0;
                    if (tile.type & BRIDGEV) {
                        layerLava.context.drawImage(this.textures.bridgeV[ind], posX, posY);
                    } else {
                        layerLava.context.drawImage(this.textures.bridgeH[ind], posX, posY);
                    }
                }
            });
        };
        const renderBrick = () => {
            this.map.forEach((tile, index) => {
                if (tile.type & (BRICK | BETON)) {
                    const { posX, posY } = calcTilePos(index, false);
                    const img = tile.type & BRICK ? this.textures.brick : this.textures.beton;
                    const imgHalf = tile.type & BRICK ? this.textures.halfBrick : this.textures.halfBeton;
                    const srcX = posX % img.width | 0;
                    const srcY = posY % img.height | 0;
                    layerBrick.context.drawImage(img,
                        srcX, srcY,
                        tileSize, tileSize,
                        posX, posY,
                        tileSize, tileSize);
                    layerHalf.context.drawImage(imgHalf,
                        srcX, srcY,
                        tileSize, tileSize,
                        posX, posY,
                        tileSize, tileSize);
                }
            });
        };
        const renderGrass = () => {
            this.map.forEach((tile, index) => {
                if (tile.type & GRASS) {
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

                console.assert(xml.childNodes.length === 1, "Count children must bu 1");

                const attrs = xml.childNodes[0].attributes;
                console.assert(attrs.width.textContent === `${this.mapWidth}`);
                console.assert(attrs.height.textContent === `${this.mapHeight}`);
                console.assert(xml.childNodes[0].childNodes.length === 5, "Should be tileset and layer");
                console.assert(xml.childNodes[0].childNodes[3].childNodes.length === 3, "Should be data");

                const data = xml
                    .childNodes[0]
                    .childNodes[3]
                    .childNodes[1]
                    .textContent
                    .split(/\s|,/)
                    .filter((val) => val !== "")
                    .map((val) => parseInt(val, 10));
                console.assert(data.length === this.mapWidth * this.mapHeight, "Wrong count tiles");

                this.map = data.map((val) => {
                    switch (val) {
                    case 0: return { x: 0, y: 0, type: EMPTY };
                    case 1: return { x: 0, y: 0, type: BRICK };
                    case 2: return { x: 0, y: 0, type: BETON };
                    case 3: return { x: 0, y: 0, type: WATER };
                    case 4: return { x: 0, y: 0, type: GRASS };
                    case 5: return { x: 0, y: 0, type: BRIDGEH };
                    case 6: return { x: 0, y: 0, type: BRIDGEV };
                    default:
                        return console.assert(false, `Unknown tile type ${val}`);
                    }
                });

                // calc adjacent grass
                for (let j = 0; j < this.mapHeight; j++) {
                    for (let i = 0; i < this.mapWidth; i++) {
                        this.map[j * this.mapWidth + i].x = i + 1;  // +1 for board
                        this.map[j * this.mapWidth + i].y = j + 1;  // +1 for board
                        for (let dy = -1; dy < 2; dy++) {
                            for (let dx = -1; dx < 2; dx++) {
                                const x = i + dx | 0;
                                const y = j + dy | 0;
                                if (x >= 0 &&
                                    x < this.mapWidth &&
                                    y >= 0 &&
                                    y < this.mapHeight &&
                                    this.map[y * this.mapWidth + x].type & GRASS) {
                                    this.map[j * this.mapWidth + i].type |= PREGRASS;
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

            this.layer0.context.drawImage(layerGround.canvas, 0, 0);
            this.layer0.context.drawImage(layerLava.canvas, 0, 0);
            this.layer0.context.drawImage(this.layerGrass.canvas, 0, 0);

            this.layer1.context.drawImage(layerGround.canvas, 0, 0);
            this.layer1.context.drawImage(layerLava.canvas, 0, 0);
            this.layer1.context.drawImage(layerHalf.canvas, 0, 0);
            this.layer1.context.drawImage(this.layerGrass.canvas, 0, 0);

            this.context = canvas.getContext("2d");
            this.context.drawImage(this.layer.canvas, 0, 0);

            console.log(`Render time = ${Date.now() - renderTime}`);

            this.event.emit("levelCreated");
        });
    }
    ready() {
        return !!this.context;
    }
    drawTile(texture, srcx, srcy, dstx, dsty, size, destContext = this.context) {
        destContext.drawImage(texture,
            srcx * this.tileSize, srcy * this.tileSize,
            size * this.tileSize, size * this.tileSize,
            dstx * this.tileSize, dsty * this.tileSize,
            size * this.tileSize, size * this.tileSize);
    }
    clearEntity(entity) {
        const x = entity.cx + 1 - entity.size * 0.5;    // for board
        const y = entity.cy + 1 - entity.size * 0.5;    // for board
        this.drawTile(this.layer.canvas, x, y, x, y, entity.size);
    }
    drawEntityBegin(entity, texture, destContext = this.context) {
        const x = entity.cx + 1 - entity.size * 0.5;    // for board
        const y = entity.cy + 1 - entity.size * 0.5;    // for board
        this.drawTile(texture, 0, 0, x, y, entity.size, destContext);
    }
    drawEntityEnd(entity, destContext = this.context) {
        if (this.collidePoint(entity.cx, entity.cy, PREGRASS | GRASS)) {
            const x = entity.cx + 1 - entity.size * 0.5;    // for board
            const y = entity.cy + 1 - entity.size * 0.5;    // for board
            this.drawTile(this.layerGrass.canvas, x, y, x, y, entity.size, destContext);
        }
    }
    drawEntity(entity, texture) {
        this.drawEntityBegin(entity, texture);
        this.drawEntityEnd(entity);
    }
    drawEntityToAllLayers(entity, texture) {
        this.drawEntityBegin(entity, texture, this.layer.context);
        this.drawEntityEnd(entity, this.layer.context);
        this.drawEntityBegin(entity, texture, this.layer0.context);
        this.drawEntityEnd(entity, this.layer0.context);
        this.clearEntity(entity);
    }
    getTile(x, y) {
        if (x < 0 || x >= this.mapWidth ||
            y < 0 || y >= this.mapHeight) return null;

        const ix = x | 0;
        const iy = y | 0;
        const ind = iy * this.mapWidth + ix;
        return this.map[ind];
    }
    collidePoint(x, y, mask) {
        const tile = this.getTile(x, y);
        return !tile || !!(tile.type & mask);
    }
    collideTank(entity) {
        const x = entity.cx + cos(entity.angle) * 0.5 * entity.size;
        const y = entity.cy + sin(entity.angle) * 0.5 * entity.size;
        const x1 = x + cos(entity.angle + 1 & 3) * 0.5;
        const y1 = y + sin(entity.angle + 1 & 3) * 0.5;
        const x2 = x - cos(entity.angle + 1 & 3) * 0.5;
        const y2 = y - sin(entity.angle + 1 & 3) * 0.5;

        return this.collidePoint(x1, y1, MOVE_MASK) || this.collidePoint(x2, y2, MOVE_MASK);
    }
    collideTankEx(entity) {
        const x = entity.cx;
        const y = entity.cy;
        return this.collidePoint(x + 0.5, y + 0.5, MOVE_MASK) ||
               this.collidePoint(x + 0.5, y - 0.5, MOVE_MASK) ||
               this.collidePoint(x - 0.5, y - 0.5, MOVE_MASK) ||
               this.collidePoint(x - 0.5, y + 0.5, MOVE_MASK);
    }
    collideBullet(entity, power) {
        const x1 = entity.cx + cos(entity.angle + 1 & 3) * 0.5;
        const y1 = entity.cy + sin(entity.angle + 1 & 3) * 0.5;
        const x2 = entity.cx - cos(entity.angle + 1 & 3) * 0.5;
        const y2 = entity.cy - sin(entity.angle + 1 & 3) * 0.5;

        const collide1 = this.collidePoint(x1, y1, BULLET_MASK);
        const collide2 = this.collidePoint(x2, y2, BULLET_MASK);

        const decrementLevel = (x, y) => {
            const tile = this.getTile(x, y);
            if (tile) {
                const tileType = tile.type & BULLET_MASK;
                const needHalf = ((tileType === BRICK) && !power) ||
                                 ((tileType === BETON) && power);
                const needEmpty = (tileType === (BRICK | HALF)) ||
                                 ((tileType === (BETON | HALF)) && power) ||
                                 ((tileType === BRICK) && power);
                const partType = tileType & BRICK ? PART.BRICK : PART.BETON;
                if (needHalf) {
                    tile.type |= HALF;
                    this.drawTile(this.layer1.canvas, tile.x, tile.y, tile.x, tile.y, 1, this.layer.context);
                    this.drawTile(this.layer.canvas, tile.x, tile.y, tile.x, tile.y, 1);
                    this.event.emit("particle", tile.x - 0.5, tile.y - 0.5, partType);
                } else if (needEmpty) {
                    tile.type &= ~BULLET_MASK;
                    this.drawTile(this.layer0.canvas, tile.x, tile.y, tile.x, tile.y, 1, this.layer.context);
                    this.drawTile(this.layer.canvas, tile.x, tile.y, tile.x, tile.y, 1);
                    this.event.emit("particle", tile.x - 0.5, tile.y - 0.5, partType);
                }
            }
        };

        if (collide1) decrementLevel(x1, y1);
        if (collide2) decrementLevel(x2, y2);

        return collide1 || collide2;
    }
}
