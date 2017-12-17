
import Entity from "./entity";
import { sin, cos } from "./utils";
import { bulletVelocity, BULLET } from "./global";

export class Bullet extends Entity {
    constructor(owner, type, callback) {
        const dx = cos(owner.angle);
        const dy = sin(owner.angle);
        const vel = bulletVelocity(type);
        const size = (vel > 5) && (type & BULLET.FIRE) ? 2 : 1;
        super(owner.cx + dx, owner.cy + dy, size, owner.angle, vel);
        this.type = type;
        this.callback = callback;
        this.alive = true;
    }
    died() {
        if (this.alive) {
            this.alive = false;
            this.callback();
        }
    }
    clear(level) {
        level.clearEntity(this);
    }
    draw(level) {
        let texture = this.type & BULLET.FIRE ? level.textures.fireSmall[this.angle] : level.textures.bullet;
        if (this.size > 1.5) texture = level.textures.fireLong[this.angle];
        level.drawEntity(this, texture);
    }
    update(level, delta) {
        if (!this.alive) return;
        this.move(delta);
        if (level.collideBullet(this, (this.type & BULLET.POWER) === BULLET.POWER)) this.died();
    }
}

export class BulletManager {
    constructor() {
        this.bullets = [];
    }
    clear(level) {
        this.bullets.forEach((bullet) => bullet.clear(level));
    }
    draw(level) {
        this.bullets.forEach((bullet) => bullet.draw(level));
    }
    add(bullet) {
        this.bullets.push(bullet);
    }
    update(level, delta) {
        const collide = (bullet) => {
            if (!bullet.alive) return;
            for (let i = 0; i < this.bullets.length; i++) {
                if (this.bullets[i].alive && bullet.collide(this.bullets[i], 0.5, 0.5)) {
                    const myFire = !!(bullet.type & BULLET.FIRE);
                    const otherFire = !!(this.bullets[i].type & BULLET.FIRE);
                    if (!myFire || otherFire) bullet.died();
                    if (!otherFire || myFire) this.bullets[i].died();
                    return;
                }
            }
        };

        this.bullets.forEach((bullet) => {
            bullet.update(level, delta);
            collide(bullet);
        });

        for (let index = 0; index < this.bullets.length;) {
            if (this.bullets[index].alive) {
                index++;
            } else {
                this.bullets.splice(index, 1);
            }
        }
    }
}
