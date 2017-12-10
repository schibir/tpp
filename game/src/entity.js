
export default class Entity {
    // angle = 0 - up, 1 - right, 2 - down, 3 - left
    constructor(cx, cy, size = 2, angle = 0, vel = 0) {
        this.cx = cx;
        this.cy = cy;
        this.size = size | 0;
        this.angle = angle | 0;
        this.vel = vel;
    }
    move(delta) {
        const sina = [-1, 0, 1, 0];
        const cosa = [0, 1, 0, -1];
        const koef = 80.0 / 1024.0;

        const dx = cosa[this.angle] * this.vel * delta * koef;
        const dy = sina[this.angle] * this.vel * delta * koef;
        this.cx += dx;
        this.cy += dy;
    }
}
