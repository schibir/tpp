
export function rand(m, radius) {
    return 2 * radius * Math.random() - radius + m;
}

export function clamp(a, min, max) {
    return Math.max(min, Math.min(max, a));
}

export function randColor(color, radius = 10) {
    const ret = new Array(3);
    for (let i = 0; i < 3; i++) ret[i] = clamp(rand(color[i], radius), 0, 255);
    return ret;
}

export function getSizeMap() {
    let mapWidth = 36;
    let mapHeight = 20;
    mapWidth += 1 + 1; // for board;
    mapHeight += 1 + 1; // for board;
    return { mapWidth, mapHeight };
}