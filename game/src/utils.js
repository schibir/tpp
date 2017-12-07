
export function rand(m, radius) {
    return 2 * radius * Math.random() - radius + m;
}

export function randColor(color, radius) {
    return [rand(color[0], radius), rand(color[1], radius), rand(color[2], radius)];
}
