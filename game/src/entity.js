
import { sin, cos } from "./utils";

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
        const koef = 80.0 / 1024.0;
        const dx = cos(this.angle) * this.vel * delta * koef;
        const dy = sin(this.angle) * this.vel * delta * koef;
        this.cx += dx;
        this.cy += dy;
    }
}
