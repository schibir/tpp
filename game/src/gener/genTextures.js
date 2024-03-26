
import SimpleBuffer from "./buffer";
import { randColor, clamp, mathRand } from "../utils";
import { TANK, ITEM, PART } from "../global";

export default class GenTextures {
    constructor(tileSize) {
        const step = tileSize * 0.2 | 0;

        // ground
        const ground = new SimpleBuffer(tileSize * 8);
        this.ground = ground
            .perlin(5, 0.9)
            .normalize(0.7, 1)
            .getColor(randColor([150, 133, 84], 20));

        // brick
        const cement = new SimpleBuffer(tileSize * 8);
        const cementImg = cement
            .perlin(5, 0.5)
            .diff([1, 0.5])
            .diff([-0.5, 1])
            .normalize(0.5, 1)
            .getColor(randColor([200, 200, 200]));

        const noise = new SimpleBuffer(tileSize * 8);
        noise
            .perlin(5, 0.5)
            .diff([1, 0.5])
            .normalize(0.6, 1.4);

        const brick = new SimpleBuffer(tileSize * 8);
        const brickImg = brick
            .brick(16, 32)
            .normalize(0.7, 1)
            .forBuf(noise, (a, b) => a * b)
            .getColor(randColor([200, 80, 60]));

        const brickMask = new SimpleBuffer(tileSize * 8);
        this.brick = brickMask
            .brickMask(16, 32)
            .gaussian(step * 0.25 | 0)
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
            .brick(8, 8, false)
            .normalize(0.6, 1)
            .forBuf(betonNoise, (a, b) => a * b)
            .getColor(randColor([160, 160, 160]));

        const betonMask = new SimpleBuffer(tileSize * 8);
        this.beton = betonMask
            .brickMask(8, 8, false)
            .gaussian(step * 0.5 | 0)
            .clamp(0.1, 0.3)
            .normalize(0, 1)
            .getColorLerp(betonImg, cementImg);

        // half
        const halfTileMask = new SimpleBuffer(tileSize * 8);
        halfTileMask
            .brickMask(8, 8, false)
            .gaussian(step)
            .normalize(3, -1)
            .clamp(0, 1);

        const halfMask = new SimpleBuffer(tileSize * 8);
        halfMask
            .perlin(20, 0.7)
            .forEach(Math.abs)
            .normalize(0, 3)
            .clamp(0, 1)
            .forBuf(halfTileMask, (a, b) => a * b);

        const half = (new SimpleBuffer(tileSize * 8))
            .copy(halfMask)
            .forEach((a) => a * a * a);

        const black = (new SimpleBuffer(tileSize * 8)).getColor();
        this.halfBrick = half.getColorLerp(black, this.brick, halfMask);
        this.halfBeton = half.getColorLerp(black, this.beton, halfMask);

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
                .gaussian(step * 2)
                .normalize(0, 1)
                .getColor([200, 200, 200], lavaLightMask);
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
                .clamp(0.25, 0.45)
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
            .bresenham(center - step, step, center, step, 1)
            .bresenham(center, step * 1.5 | 0, center + step * 1.5 | 0, step * 1.5 | 0, 1)
            .bresenham(step * 2, step * 2, step, step, 1.5)
            .bresenham(eagle.size - step * 2, step * 2, eagle.size - step, step, 1.5)
            .bresenham(3 * step, 3 * step, step, 3 * step, 1)
            .bresenham(eagle.size - 3 * step, 3 * step, eagle.size - step, 3 * step, 1)
            .bresenham(4 * step, 4 * step, step, 4 * step, 1)
            .bresenham(eagle.size - 4 * step, 4 * step, eagle.size - step, 4 * step, 1)
            .gaussian(step)
            .normalize(0, 1);

        const eagleMask = new SimpleBuffer(eagle.size);
        eagleMask
            .copy(eagle)
            .clamp(0.1, 0.2)
            .normalize(0, 1);

        const eagleColor = new SimpleBuffer(eagle.size);
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

        const transformImage = (image, callback) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = image.width;
            canvas.height = image.height;

            context.save();

            context.translate(image.width * 0.5, image.height * 0.5);
            callback(context);
            context.translate(-image.width * 0.5, -image.height * 0.5);
            context.drawImage(image, 0, 0);

            context.restore();
            return canvas;
        };
        /* eslint-disable arrow-body-style */
        const rotateImage = (image, angle) => {
            return transformImage(image, (context) => context.rotate(Math.PI * 0.5 * angle));
        };
        const scaleImage = (image, vec) => {
            return transformImage(image, (context) => context.scale(vec[0], vec[1]));
        };
        /* eslint-enable arrow-body-style */

        // Bridge
        this.bridgeV = new Array(8);
        for (let k = 0; k < this.bridgeV.length; k++) {
            const bridgeMask = new SimpleBuffer(tileSize * 2);
            bridgeMask
                .perlin(5, 0.5)
                .forEach((a, i, j) => {
                    const x = (i / bridgeMask.size - 0.5) * 2;
                    const y = (j / bridgeMask.size - 0.5) * 2;
                    const factorX = Math.abs(x) < 0.4 ? 1 : 0;
                    let factorY = clamp((2 - 2 * Math.abs(y)), 0, 1);
                    factorY += 0.25 * a;
                    factorY = (clamp(factorY, 0.3, 0.4) - 0.3) * 10;
                    return factorX * factorY;
                });

            const bridge = new SimpleBuffer(tileSize * 2);
            this.bridgeV[k] = bridge
                .perlin(5, 0.5)
                .forEach((a) => a * a)
                .diffFree()
                .normalize(0.5, 1.5)
                .forEach((a, i) => {
                    const x = i / bridge.size * Math.PI * 8;
                    return a * Math.abs(Math.cos(x));
                })
                .forBuf(bridgeMask, (a, b) => a * b * b)
                .normalize(0.5, 1)
                .getColor([182, 155, 76], bridgeMask);
        }

        this.bridgeH = [];
        this.bridgeV.forEach((bridge) => this.bridgeH.push(rotateImage(bridge, 1)));

        // Tanks
        const createTrack = (size, offset, isWheel) => {
            const trackMask = new SimpleBuffer(tileSize * 2);
            trackMask
                .forEach((a, i, j) => {
                    const x = (i / trackMask.size - 0.5) * 2;
                    const y = (j / trackMask.size - 0.5) * 2;
                    let factorX = Math.abs(x) < size ? 1 : 0;
                    factorX *= Math.abs(x) < 0.5 ? 0 : 1;
                    let factorY = Math.abs(y) < size ? 1 : 0;
                    let wheel = j / trackMask.size * Math.PI * 3;
                    wheel = Math.abs(Math.sin(wheel));
                    wheel = wheel < 0.5 && isWheel ? 0 : 1;
                    factorY *= wheel;
                    return factorX * factorY;
                });

            const track = new SimpleBuffer(tileSize * 2);
            return track
                .forEach((a, i, j) => {
                    const y = j / track.size * Math.PI * 10;
                    return Math.abs(Math.cos(y + Math.PI * offset));
                })
                .normalize(0.5, 1)
                .getColor(isWheel ? [80, 80, 80] : [160, 160, 160], trackMask);
        };
        const smoothedSquare = (buffer, width, height) => {
            buffer
                .forEach((a, i, j) => {
                    const x = (i / buffer.size - 0.5) * 2;
                    const y = (j / buffer.size - 0.5) * 2;
                    const factorX = Math.abs(x) < width ? 1 : 0;
                    const factorY = Math.abs(y) < height ? 1 : 0;
                    return factorX * factorY;
                })
                .gaussian(step);
            return buffer;
        };
        const createCorpus = (size, color, width = 0.6) => {
            const corpusMask = new SimpleBuffer(tileSize * 2);
            smoothedSquare(corpusMask, width, size)
                .clamp(0.5, 0.6)
                .normalize(0, 1);

            const corpus = new SimpleBuffer(tileSize * 2);
            return corpus
                .brick(10, 10)
                .diff([1, 0.5])
                .normalize(0, 1)
                .forEach((a, i, j) => {
                    const y = (j / corpus.size - 0.5) * 2;
                    if (Math.abs(y) < size * 0.5) return a;
                    const k = clamp((size - Math.abs(y)) / (size * 0.5), 0, 1);
                    return a * Math.sqrt(k);
                })
                .normalize(0.25, 1)
                .getColor(color, corpusMask);
        };
        const createTurret = (size, barrelWidth, barrelLength, color) => {
            const barrelMask = new SimpleBuffer(tileSize * 2);
            smoothedSquare(barrelMask, barrelWidth, barrelLength)
                .clamp(0.5, 0.6)
                .normalize(0, 1)
                .forEach((a, i, j) => (j < barrelMask.size * 0.5 ? a : 0));

            const barrel = new SimpleBuffer(tileSize * 2);
            const barrelImg = smoothedSquare(barrel, barrelWidth, barrelLength)
                .diff([1, 0.5])
                .normalize(0.25, 1)
                .getColor([220, 220, 220], barrelMask);

            const turretMask = new SimpleBuffer(tileSize * 2);
            turretMask
                .normDist(size)
                .clamp(0.1, 0.15)
                .normalize(0, 1);

            const turret = new SimpleBuffer(tileSize * 2);
            const turretImg = turret
                .normDist(size)
                .diff([1, 0.5])
                .normalize(0.25, 1)
                .forBuf(turretMask, (a, b) => a * (Math.abs(b - 0.5) + 0.5))
                .getColor(color, turretMask);

            const ctx = barrelImg.getContext("2d");
            ctx.drawImage(turretImg, 0, 0);
            return barrelImg;
        };

        /* eslint-disable key-spacing */
        const colors = {
            [TANK.TANK1]:   [200, 150, 100],
            [TANK.TANK2]:   [100, 150, 200],
            [TANK.SIMPLE]:  [120, 200, 120],
            [TANK.BMP]:     [200, 200, 200],
            [TANK.CANNON]:  [250, 230, 134],
            [TANK.STRONG]:  [100, 200, 180],
            [TANK.PANZER]:  [211, 229, 224],
        };
        const zombieColor = [238, 30, 30];

        this.tankBodies = new Array(4);
        this.tankTurret = new Array(4);
        this.tankTurretEx = new Array(4);
        this.tankTurretZ = new Array(4);
        this.tankTrack = new Array(4);

        this.tankBodies[0] = {
            [TANK.TANK1]:   createCorpus(0.7, colors[TANK.TANK1]),
            [TANK.TANK2]:   createCorpus(0.7, colors[TANK.TANK2]),
            [TANK.SIMPLE]:  createCorpus(0.5, colors[TANK.SIMPLE]),
            [TANK.BMP]:     createCorpus(0.7, colors[TANK.BMP], 0.5),
            [TANK.CANNON]:  createCorpus(0.5, colors[TANK.CANNON]),
            [TANK.STRONG]:  createCorpus(0.75, colors[TANK.STRONG]),
            [TANK.PANZER]:  createCorpus(1, colors[TANK.PANZER]),
        };

        this.tankTurret[0] = {
            [TANK.TANK1]:   createTurret(0.7, 0.1, 0.7, colors[TANK.TANK2]),
            [TANK.TANK2]:   createTurret(0.7, 0.1, 0.7, colors[TANK.TANK1]),
            [TANK.SIMPLE]:  createTurret(0.7, 0.1, 0.7, colors[TANK.SIMPLE]),
            [TANK.BMP]:     createTurret(0.4, 0.1, 0.6, colors[TANK.BMP]),
            [TANK.CANNON]:  createTurret(0.7, 0.1, 1, colors[TANK.CANNON]),
            [TANK.STRONG]:  createTurret(0.7, 0.1, 0.7, colors[TANK.STRONG]),
            [TANK.PANZER]:  createTurret(1, 0.2, 1, colors[TANK.PANZER]),
        };
        this.tankTurretEx[0] = {
            [TANK.TANK1]:   createTurret(0.7, 0.1, 1, colors[TANK.TANK2]),
            [TANK.TANK2]:   createTurret(0.7, 0.1, 1, colors[TANK.TANK1]),
        };
        this.tankTurretZ[0] = createTurret(0.7, 0.1, 0.7, zombieColor);

        const countAnimTrack = 8;
        const trackSimple = new Array(countAnimTrack);
        const trackBMP = new Array(countAnimTrack);
        const trackPanzer = new Array(countAnimTrack);

        for (let offset = 0; offset < countAnimTrack; offset++) {
            trackSimple[offset] = createTrack(0.8, offset / countAnimTrack, false);
            trackBMP[offset] = createTrack(0.8, offset / countAnimTrack, true);
            trackPanzer[offset] = createTrack(1, offset / countAnimTrack, false);
        }

        this.tankTrack[0] = {
            [TANK.TANK1]:   trackSimple,
            [TANK.TANK2]:   trackSimple,
            [TANK.SIMPLE]:  trackSimple,
            [TANK.BMP]:     trackBMP,
            [TANK.CANNON]:  trackSimple,
            [TANK.STRONG]:  trackSimple,
            [TANK.PANZER]:  trackPanzer,
        };
        /* eslint-enable key-spacing */

        for (let i = 1; i < 4; i++) {
            this.tankBodies[i] = {};
            this.tankTurret[i] = {};
            this.tankTurretEx[i] = {};
            this.tankTurretZ[i] = {};
            this.tankTrack[i] = {};

            for (let type = TANK.TANK1; type < TANK.RANDOM; type++) {
                this.tankBodies[i][type] = rotateImage(this.tankBodies[0][type], i);
                this.tankTurret[i][type] = rotateImage(this.tankTurret[0][type], i);
                this.tankTrack[i][type] = new Array(countAnimTrack);
                for (let offset = 0; offset < countAnimTrack; offset++) {
                    this.tankTrack[i][type][offset] = rotateImage(this.tankTrack[0][type][offset], i);
                }
            }
            this.tankTurretEx[i][TANK.TANK1] = rotateImage(this.tankTurretEx[0][TANK.TANK1], i);
            this.tankTurretEx[i][TANK.TANK2] = rotateImage(this.tankTurretEx[0][TANK.TANK2], i);
            this.tankTurretZ[i] = rotateImage(this.tankTurretZ[0], i);
        }

        // bullet
        const bulletMask = new SimpleBuffer(tileSize);
        bulletMask
            .normDist(1)
            .clamp(0.1, 0.2)
            .normalize(0, 1);

        const bullet = new SimpleBuffer(tileSize);
        this.bullet = bullet
            .normDist(1)
            .diff([1, 0.5])
            .normalize(0.5, 1)
            .forBuf(bulletMask, (a, b) => a * (5 * (Math.abs(b - 0.5) - 0.5) + 1))
            .getColor([255, 255, 255], bulletMask);

        // fire
        const createFire = (size) => {
            const koef = tileSize / size;
            const plume = new SimpleBuffer(size);
            for (let i = 0; i < size * 0.75 | 0; i++) {
                const plumeStep = new SimpleBuffer(size);
                plumeStep.normDist(koef * 0.75 - koef * 0.75 * i / (size * 0.75), 0, 0.5 - 2 * i / size);
                plume.forBuf(plumeStep, (a, b) => a + b);
            }
            plume.normalize(0, 1);

            const fire = new SimpleBuffer(size);
            return fire
                .normDist(koef, 0, 0.5)
                .clamp(0.1, 0.5)
                .normalize(0, 1)
                .forBuf(plume, (a, b) => a + b)
                .normalize(0, 2)
                .getColor2([255, 0, 0], [255, 255, 127], fire);
        };

        this.fireSmall = new Array(4);
        this.fireLong = new Array(4);
        this.fireLong[0] = createFire(tileSize * 2);
        this.fireSmall[0] = createFire(tileSize);

        for (let i = 1; i < 4; i++) {
            this.fireLong[i] = rotateImage(this.fireLong[0], i);
            this.fireSmall[i] = rotateImage(this.fireSmall[0], i);
        }

        // shield
        const shieldMask = new SimpleBuffer(tileSize * 3);
        shieldMask
            .forEach((a, i, j) => {
                const x = (i / shieldMask.size - 0.5) * 2;
                const y = (j / shieldMask.size - 0.5) * 2;
                const factorX = 25 / 16 * x * x;
                const factorY = 25 / 16 * y * y;
                const ret = Math.max(factorX, factorY);
                return ret < 1 ? ret : 0;
            })
            .gaussian(step * 2)
            .normalize(0, 1);

        const createShield = () => {
            const offsetX = new SimpleBuffer(tileSize * 3);
            offsetX.perlin(2, 0.5);
            const offsetY = new SimpleBuffer(tileSize * 3);
            offsetY.perlin(2, 0.5);

            const shield = new SimpleBuffer(tileSize * 3);
            return shield
                .forEach((a, i, j) => {
                    const x = (i / shieldMask.size - 0.5) * 2;
                    const y = (j / shieldMask.size - 0.5) * 2;
                    const factorX = 1 - 25 / 16 * x * x;
                    const factorY = 1 - 25 / 16 * y * y;

                    const dx = offsetX.getData(i, j);
                    const dy = offsetY.getData(i, j);
                    const tx = clamp(i + dx * step * factorY, 0, shieldMask.size) | 0;
                    const ty = clamp(j + dy * step * factorX, 0, shieldMask.size) | 0;
                    return shieldMask.getData(tx, ty);
                })
                .getColor([255, 255, 512], shield);
        };

        this.shield = [];
        for (let i = 0; i < 8; i++) {
            this.shield.push(createShield());
        }

        // respawn
        // for animation use this formula
        // const ind = ((Date.now() - this.timeRespawn) / 50) % level.textures.respawn.length | 0;
        const respawn = new SimpleBuffer(tileSize * 2);
        const countAnimRespawn = 8;
        this.respawn = new Array(countAnimRespawn);
        this.respawn[0] = respawn
            .forEach((a, i, j) => {
                const x = (i / respawn.size - 0.5) * 2;
                const y = (j / respawn.size - 0.5) * 2;
                return 1 / (Math.abs(x) + Math.abs(y) + 1) - 0.5;
            })
            .clamp(0, 1)
            .gaussian(step)
            .normalize(0, 1)
            .getColor([255, 512, 255], respawn);

        for (let i = 1; i < countAnimRespawn; i++) {
            const koef = 0.3 * Math.sin(i / countAnimRespawn * Math.PI * 2);
            this.respawn[i] = scaleImage(this.respawn[0], [1 + koef, 1 - koef]);
        }

        // Items
        const itemTemplateMask = new SimpleBuffer(tileSize * 2);
        itemTemplateMask
            .forEach((a, i, j) => {
                const x = (i / itemTemplateMask.size - 0.5) * 2;
                const y = (j / itemTemplateMask.size - 0.5) * 2;
                let factorX = 0.5;
                let factorY = 0.5;
                if ((Math.abs(x) > 0.7 && Math.abs(x) < 0.8) ||
                    (Math.abs(y) > 0.7 && Math.abs(y) < 0.8)) {
                    factorX = 1;
                    factorY = 1;
                }
                if (Math.abs(x) > 0.8) factorX = 0;
                if (Math.abs(y) > 0.8) factorY = 0;
                return Math.min(factorX, factorY);
            })
            .gaussian(step)
            .clamp(0.45, 0.55)
            .normalize(0, 1);

        const itemTemplate = new SimpleBuffer(tileSize * 2);
        itemTemplate
            .forEach((a, i, j) => {
                const x = (i / itemTemplate.size - 0.5) * 2;
                const y = (j / itemTemplate.size - 0.5) * 2;
                const factorX = Math.abs(x) > 0.7 && Math.abs(x) < 0.8 ? 1 : 0;
                const factorY = Math.abs(y) > 0.7 && Math.abs(y) < 0.8 ? 1 : 0;
                return factorX + factorY;
            })
            .gaussian(step)
            .normalize(0, 2)
            .clamp(0, 1)
            .normalize(0, 1.5);

        const getItemTemplateImg = () => itemTemplate.getColor([127, 174, 249], itemTemplateMask);

        // fireball
        const itemFire = getItemTemplateImg();
        itemFire.getContext("2d").drawImage(this.fireSmall[0], tileSize * 0.5, tileSize * 0.5);

        // zombie
        const zombie = new SimpleBuffer(tileSize * 2);
        for (let i = 0; i < zombie.size / 8 | 0; i++) {
            const x1 = zombie.size / 4 | 0;
            const x2 = zombie.size - x1;
            const y1 = x1;
            const y2 = zombie.size - y1 - zombie.size / 8 | 0;
            zombie.bresenham(x1, y1 + i, x2, y1 + i, 1);
            zombie.bresenham(x1, y2 + i, x2, y2 + i, 1);
            zombie.bresenham(x1, y2 + i, x2, y1 + i, 1);
        }
        zombie
            .gaussian(2)
            .normalize(0, 1);

        const itemZombie = getItemTemplateImg();
        itemZombie.getContext("2d").drawImage(zombie.getColor(zombieColor, zombie), 0, 0);

        // speed
        const speed = new SimpleBuffer(tileSize * 2);
        this.speedImg = speed
            .forEach((a, i, j) => {
                const x = (i / itemTemplate.size - 0.5) * 2;
                const y = (j / itemTemplate.size - 0.5) * 2;
                let arrow = -y + Math.sqrt(3) * Math.abs(x) < 0.5 ? 1 : 0;
                arrow *= y < 0 ? 1 : 0;
                const factorX = Math.abs(x) < 0.125 ? 1 : 0;
                const factorY = y >= 0 && y < 0.5 ? 1 : 0;
                return arrow + factorX * factorY;
            })
            .gaussian(2)
            .normalize(0, 1)
            .getColor([127, 174, 249], speed);

        const itemSpeed = getItemTemplateImg();
        itemSpeed.getContext("2d").drawImage(this.speedImg, 0, 0);

        // knukle
        const knukleCoord = [
            [0.7, 0.53, 0.7, 0.33, 1],
            [0.6, 0.55, 0.6, 0.28, 1],
            [0.5, 0.53, 0.5, 0.23, 1],
            [0.4, 0.355, 0.4, 0.255, 1],
            [0.425, 0.43, 0.3, 0.43, 1],
            [0.3, 0.43, 0.3, 0.58, 1.5],
            [0.3, 0.63, 0.5, 0.73, 2],
            [0.3, 0.58, 0.6, 0.68, 2],
            [0.5, 0.73, 0.72, 0.61, 2],
            [0.5, 0.73, 0.7, 0.65, 2],
        ];

        const knukle = new SimpleBuffer(tileSize * 2);
        knukleCoord.forEach((coord) => {
            const x1 = coord[0] * knukle.size | 0;
            const y1 = coord[1] * knukle.size | 0;
            const x2 = coord[2] * knukle.size | 0;
            const y2 = coord[3] * knukle.size | 0;
            const val = coord[4];
            knukle.bresenham(x1, y1, x2, y2, val);
        });

        const knukleImg = knukle
            .gaussian(step * 0.5 | 0)
            .clamp(0, 0.1)
            .normalize(0, 1)
            .getColor([231, 215, 242], knukle);

        const itemKnukle = getItemTemplateImg();
        itemKnukle.getContext("2d").drawImage(knukleImg, 0, 0);

        // star
        const createStar = () => {
            const getStar5 = (number, x, y) => {
                const sina = Math.sin(Math.PI * 0.4 * number);
                const cosa = Math.cos(Math.PI * 0.4 * number);
                const X = x * cosa - y * sina;
                const Y = y * cosa + x * sina;
                let star5 = 0.6 + Y - Math.abs(X) / Math.tan(Math.PI * 0.1);
                star5 *= Y <= 0 ? 1 : 0;
                return star5;
            };
            return (new SimpleBuffer(tileSize * 2))
                .forEach((a, i, j) => {
                    const x = (i / itemTemplate.size - 0.5) * 2;
                    const y = (j / itemTemplate.size - 0.5) * 2;

                    let star5 = getStar5(0, x, y);
                    for (let n = 1; n < 5; n++) {
                        star5 = Math.max(star5, getStar5(n, x, y));
                    }
                    return star5;
                });
        };

        const starMask = createStar()
            .normalize(0, 20)
            .clamp(0, 1)
            .gaussian(step * 0.5 | 0)
            .clamp(0.1, 0.2)
            .normalize(0, 1);

        this.starImg = createStar()
            .diff([1, 1])
            .normalize(0, 2)
            .gaussian(step * 0.5 | 0)
            .getColor([239, 230, 155], starMask);

        const itemStar = getItemTemplateImg();
        itemStar.getContext("2d").drawImage(this.starImg, 0, 0);

        // life
        const life = new SimpleBuffer(tileSize * 2);
        life
            .forEach((a, i, j) => {
                const x = (i / life.size - 0.5) * 2;
                const y = (j / life.size - 0.5) * 2;
                const trackX = Math.abs(x) < 0.5 ? 1 : 0;
                const trackY = y > 0.1 && y < 0.3 ? 1 : 0;
                const turretX = Math.abs(x) < 0.15 ? 1 : 0;
                const turretY = y > -0.3 && y < 0.2 ? 1 : 0;
                return turretX * turretY + trackX * trackY;
            })
            .gaussian(step)
            .clamp(0.1, 0.3)
            .normalize(0, 1)
            .bresenham(tileSize, tileSize - step, tileSize * 1.5 | 0, tileSize - step, 1)
            .bresenham(tileSize, tileSize - step + 1, tileSize * 1.5 | 0, tileSize - step + 1, 1)
            .bresenham(tileSize, tileSize - step + 2, tileSize * 1.5 | 0, tileSize - step + 2, 1)
            .forEach((a, i, j) => {
                const x = (i / life.size - 0.5) * 2;
                const y = (j / life.size - 0.5) * 2;

                const circle = (cx, cy) => {
                    const dx = x - cx;
                    const dy = y - cy;
                    return Math.sqrt(dx * dx + dy * dy) < 0.1 ? 0 : 1;
                };

                return a *
                    circle(-0.33, 0.2) *
                    circle(0, 0.2) *
                    circle(0.33, 0.2);
            });

        const lifeColor = new SimpleBuffer(tileSize * 2);
        this.lifeImg = lifeColor
            .copy(life)
            .gaussian(step)
            .diff([1, 0.5])
            .normalize(0.5, 1.5)
            .getColor([190, 190, 190], life);

        const itemLife = getItemTemplateImg();
        itemLife.getContext("2d").drawImage(this.lifeImg, 0, 0);

        this.item = {
            [ITEM.LIFE]: itemLife,
            [ITEM.KNUKLE]: itemKnukle,
            [ITEM.ZOMBIE]: itemZombie,
            [ITEM.STAR]: itemStar,
            [ITEM.SPEED]: itemSpeed,
            [ITEM.FIREBALL]: itemFire,
        };

        // decal
        const createDecal = () => {
            const decal = new SimpleBuffer(tileSize * 3);
            const halfSize = decal.size * 0.5 | 0;
            decal.normDist(1);

            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 30) {
                const x = halfSize + Math.cos(angle) * mathRand(halfSize * 0.75, halfSize * 0.25) | 0;
                const y = halfSize + Math.sin(angle) * mathRand(halfSize * 0.75, halfSize * 0.25) | 0;
                decal.bresenham(halfSize, halfSize, x, y, 1);
            }

            return decal
                .gaussian(step)
                .clamp(0, 0.5)
                .normalize(0, 0.5)
                .getColor([0, 0, 0], decal);
        };

        this.decals = [];
        const COUNT_DECALS = 5;
        for (let i = 0; i < COUNT_DECALS; i++) {
            this.decals.push(createDecal());
        }
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * 4;
            const ind = Math.random() * COUNT_DECALS | 0;
            this.decals.push(rotateImage(this.decals[ind], angle));
        }

        // particles
        function createSpark(fireball) {
            const COUNT_FRAMES = fireball ? 10 : 32;
            const COUNT_PART = fireball ? 5 : 16;
            const SIZE = tileSize * (fireball ? 2 : 4);

            const ret = [];
            const pos = new Array(COUNT_PART);
            const vel = new Array(COUNT_PART);

            for (let i = 0; i < COUNT_PART; i++) {
                const sx = mathRand(0, 1 / COUNT_FRAMES);
                const sy = mathRand(0, 1 / COUNT_FRAMES);
                const px = fireball ? 0 : mathRand(0, 0.25);
                const py = fireball ? 0 : mathRand(0, 0.25);
                pos[i] = [px, py];
                vel[i] = [sx, sy];
            }

            let bufPrevFrame = null;
            for (let i = 0; i < COUNT_FRAMES; i++) {
                const buf = new SimpleBuffer(SIZE);
                const factor = 1 - i / COUNT_FRAMES;

                if (bufPrevFrame) {
                    buf.forBuf(bufPrevFrame, (a, b) => b * (fireball ? 0.9 : 1));
                }

                for (let j = 0; j < COUNT_PART; j++) {
                    const x = pos[j][0];
                    const y = pos[j][1];

                    const radius = fireball ? 0.25 : 0.5 * factor;
                    const bufPart = new SimpleBuffer(SIZE);
                    bufPart.normDist(radius, x, y);
                    buf.forBuf(bufPart, (a, b) => a + b);

                    pos[j][0] += vel[j][0];
                    pos[j][1] += vel[j][1];
                }
                buf.normalize(0, (fireball ? 2 : 5) * factor);
                bufPrevFrame = buf;
                ret.push(buf);
            }
            return ret;
        }

        // particle for fireball
        this.sparksFire = new Array(16);
        const COUNT_GENERATED_SPARKS = 4;
        for (let i = 0; i < COUNT_GENERATED_SPARKS; i++) {
            const sparks = createSpark(true);
            this.sparksFire[i] = [];
            sparks.forEach((spark) => {
                this.sparksFire[i].push(spark
                    .getColor2([255, 0, 0], [255, 255, 127], spark));
            });
        }
        for (let i = COUNT_GENERATED_SPARKS; i < this.sparksFire.length; i++) {
            this.sparksFire[i] = [];
            const angle = Math.random() * 4;
            const ind = Math.random() * COUNT_GENERATED_SPARKS | 0;
            this.sparksFire[ind].forEach((spark) => this.sparksFire[i].push(rotateImage(spark, angle)));
        }

        // particle for simple bullet
        this.sparksBullet = new Array(10);
        for (let i = 0; i < this.sparksBullet.length; i++) {
            const sparkMask = new SimpleBuffer(tileSize * 0.5 | 0);
            sparkMask
                .normDist(1)
                .clamp(0.1, 0.3)
                .normalize(0, 1);

            const spark = new SimpleBuffer(tileSize * 0.5 | 0);
            spark
                .normDist(1)
                .diff([1, 0.5])
                .normalize(0.5, 1)
                .forBuf(sparkMask, (a, b) => a * (5 * (Math.abs(b - 0.5) - 0.5) + 1));

            sparkMask.normalize(0, 1 - i / this.sparksBullet.length);
            this.sparksBullet[i] = spark.getColor([255, 255, 255], sparkMask);
        }

        // particle for brick
        const createSparkBrickBeton = (color) => {
            const createSparkBrick = (size) => {
                const offsetX = new SimpleBuffer(tileSize * 0.5 | 0);
                offsetX.perlin(2, 0.5);
                const offsetY = new SimpleBuffer(tileSize * 0.5 | 0);
                offsetY.perlin(2, 0.5);

                const sparkBrickMask = new SimpleBuffer(tileSize * 0.5 | 0);
                sparkBrickMask
                    .normDist(size)
                    .normalize(0, 1)
                    .clamp(0.1, 0.3)
                    .normalize(0, 1);

                const sparkNoise = new SimpleBuffer(tileSize * 0.5 | 0);
                sparkNoise
                    .perlin(5, 0.5)
                    .diff([1, 0.5])
                    .normalize(0.6, 1.4);

                const random = mathRand(0.8, 0.2);

                const spark = new SimpleBuffer(tileSize * 0.5 | 0);
                spark
                    .forEach((a, i, j) => {
                        const dx = offsetX.getData(i, j);
                        const dy = offsetY.getData(i, j);
                        const tx = clamp(i + dx * step * 0.4, 0, sparkBrickMask.size) | 0;
                        const ty = clamp(j + dy * step * 0.4, 0, sparkBrickMask.size) | 0;
                        return sparkBrickMask.getData(tx, ty);
                    });

                return (new SimpleBuffer(tileSize * 0.5 | 0))
                    .forBuf(spark, (a, b) => b * random)
                    .forBuf(sparkNoise, (a, b) => a * b)
                    .getColor(randColor(color), spark);
            };

            const ret = [];
            for (let i = 0; i < 10; i++) {
                ret[i] = [];
                ret[i].push(createSparkBrick(i / 10));

                const COUNT_ANGLES = 32;
                for (let angle = 1; angle < COUNT_ANGLES; angle++) {
                    ret[i].push(rotateImage(ret[i][0], angle / COUNT_ANGLES * 4));
                }
            }
            return ret;
        };

        this.sparksBrick = createSparkBrickBeton([200, 80, 60]);

        // particle for beton
        this.sparksBeton = createSparkBrickBeton([160, 160, 160]);

        // fire and smoke
        const createSmoke = (lvl) => {
            const ret = new Array(16);
            for (let i = 0; i < ret.length; i++) {
                const smokeNoise = new SimpleBuffer(tileSize);
                smokeNoise
                    .perlin(2, 0.5)
                    .forEach(Math.abs);

                const koef = 0.25 * (lvl + 1);
                const factor = i / ret.length;
                const smoke = new SimpleBuffer(tileSize);
                smoke
                    .normDist(1.5)
                    .normalize(0, 1)
                    .forBuf(smokeNoise, (a, b) => a * b)
                    .normalize(0, koef * clamp(1.5 - 1.5 * factor, 0, 1));

                if (i === 0 && lvl === 3) {
                    ret[i] = smoke.getColor2([255, 0, 0], [255, 255, 127], smoke);
                } else {
                    ret[i] = smoke.getColor([190, 190, 190], smoke);
                }
            }
            return ret;
        };
        this.smokes = {
            [PART.SMOKE0]: createSmoke(0),
            [PART.SMOKE1]: createSmoke(1),
            [PART.SMOKE2]: createSmoke(2),
            [PART.SMOKE3]: createSmoke(3),
        };

        // explode
        this.explode = new Array(16);
        const COUNT_GENERATED_EXPLODE = 2;
        for (let i = 0; i < COUNT_GENERATED_EXPLODE; i++) {
            const explode = createSpark(false);
            this.explode[i] = [];
            explode.forEach((exp) => {
                this.explode[i].push(exp
                    .getColor2([255, 0, 0], [255, 255, 127], exp));
            });
        }
        for (let i = COUNT_GENERATED_EXPLODE; i < this.explode.length; i++) {
            this.explode[i] = [];
            const angle = Math.random() * 4;
            const ind = Math.random() * COUNT_GENERATED_EXPLODE | 0;
            this.explode[ind].forEach((exp) => this.explode[i].push(rotateImage(exp, angle)));
        }

        // indicator
        this.indicator = (new SimpleBuffer(tileSize))
            .forEach((a, i) => i / tileSize)
            .getColor2([255, 0, 0], [0, 255, 0]);

        // text
        const itemText = {
            [ITEM.LIFE]: "Life",
            [ITEM.KNUKLE]: "Knukle",
            [ITEM.ZOMBIE]: "Friendly#fire",
            [ITEM.STAR]: "Star",
            [ITEM.SPEED]: "Speed",
            [ITEM.FIREBALL]: "Fireball",
            [ITEM.FIREBALL + 1]: "Private",
            [ITEM.FIREBALL + 2]: "Corporal",
            [ITEM.FIREBALL + 3]: "Junior#sergeant",
            [ITEM.FIREBALL + 4]: "Sergeant",
            [ITEM.FIREBALL + 5]: "Senior#sergeant",
            [ITEM.FIREBALL + 6]: "Sergeant#major",
            [ITEM.FIREBALL + 7]: "Junior#lieutenant",
            [ITEM.FIREBALL + 8]: "Lieutenant",
            [ITEM.FIREBALL + 9]: "Captain",
            [ITEM.FIREBALL + 10]: "Major",
            [ITEM.FIREBALL + 11]: "Colonel",
            [ITEM.FIREBALL + 12]: "Major#general",
            [ITEM.FIREBALL + 13]: "Lieutenant#general",
            [ITEM.FIREBALL + 14]: "Colonel#general",
            [ITEM.FIREBALL + 15]: "Army#general",
            [ITEM.FIREBALL + 16]: "Marshal",
        };
        this.itemText = {};
        for (let i = ITEM.LIFE; i <= ITEM.FIREBALL + 16; i++) {
            const mask = new SimpleBuffer(tileSize * 3);
            const buf = mask.getColor([0, 0, 0], mask);
            const ctx = buf.getContext("2d");
            ctx.font = `${tileSize * 0.5 | 0}px Verdana, Geneva, Arial, Helvetica, sans-serif`;
            ctx.fillStyle = i <= ITEM.FIREBALL ? "rgb(200, 255, 200)" : "rgb(255, 200, 200)";
            ctx.textAlign = "center";
            const texts = itemText[i].split("#");
            const y = texts.length > 1 ? 1.5 : 2;
            ctx.fillText(texts[0], tileSize * 1.5, tileSize * y);
            if (texts.length === 2) ctx.fillText(texts[1], tileSize * 1.5, tileSize * 2);
            this.itemText[i] = buf;
        }
    }
}
