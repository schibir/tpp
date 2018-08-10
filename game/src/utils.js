
let randomSeed = (Date.now() * Math.random()) & 0xffffffff;

export class Random {
    static setSeed(seed) {
        randomSeed = seed;
    }
    static getSeed() {
        return randomSeed;
    }
    static next() {
        randomSeed = (randomSeed * 214013 + 2531011) & 0xffffffff;
        const ret = (randomSeed >> 16) & 0x7fff;
        return ret / 32767.0;
    }
}

export function rand(m, radius) {
    return 2 * radius * Random.next() - radius + m;
}

export function clamp(a, min, max) {
    return Math.max(min, Math.min(max, a));
}

export function randColor(color, radius = 10) {
    const ret = new Array(3);
    for (let i = 0; i < 3; i++) ret[i] = clamp(rand(color[i], radius), 0, 255);
    return ret;
}

export function getMapSize() {
    let mapWidth = 36;
    let mapHeight = 20;
    mapWidth += 1 + 1; // for board;
    mapHeight += 1 + 1; // for board;
    return { mapWidth, mapHeight };
}

export function getTileSize(width, height) {
    const { mapWidth, mapHeight } = getMapSize();
    const tileWidth = width / mapWidth | 0;
    const tileHeight = height / mapHeight | 0;
    return Math.min(tileWidth, tileHeight);
}

export function cos(angle) {
    return [0, 1, 0, -1][angle];
}

export function sin(angle) {
    return [-1, 0, 1, 0][angle];
}

export function getProbability(probabilities) {
    const sum = probabilities.reduce((acc, val) => acc + val);
    let current = Random.next() * sum;
    for (let i = 0; i < probabilities.length; i++) {
        current -= probabilities[i];
        if (current < 0) return i;
    }
    return 0;
}

// uint safeIndex(float, uint)
export function floatToIndex(float, maxIndex) {
    const ret = (float * maxIndex | 0) % maxIndex | 0;
    return ret < 0 ? ret + maxIndex : ret;
}
