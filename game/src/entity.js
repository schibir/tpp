
import { sin, cos } from "./utils";

export class Entity {
    // angle = 0 - up, 1 - right, 2 - down, 3 - left
    constructor(cx, cy, size = 2, angle = 0, vel = 0) {
        this.cx = cx;
        this.cy = cy;
        this.size = size | 0;
        this.angle = angle | 0;
        this.vel = vel;
    }
    move(delta) {
        const koef = 80.0 / 1024.0 / 25;
        const dx = cos(this.angle) * this.vel * delta * koef;
        const dy = sin(this.angle) * this.vel * delta * koef;
        this.cx += dx;
        this.cy += dy;
    }
    collide(other, mySizeKoef, otherSizeKoef) {
        if (this === other) return false;
        const minRadius = this.size * mySizeKoef * 0.5 + other.size * otherSizeKoef * 0.5;
        return (Math.abs(this.cx - other.cx) <= minRadius &&
                Math.abs(this.cy - other.cy) <= minRadius);
    }
}

export class EntityManager {
    constructor() {
        this.objects = [];
    }
    clear(level) {
        this.objects.forEach((obj) => obj.clear(level));
    }
    draw(level) {
        this.objects.forEach((obj) => obj.draw(level));
    }
    update(level, delta) {
        this.objects.forEach((obj) => obj.update(level, delta));
        this.splice();
    }
    splice() {
        for (let index = 0; index < this.objects.length;) {
            if (this.objects[index].alive) {
                index++;
            } else {
                this.objects.splice(index, 1);
            }
        }
    }
}
