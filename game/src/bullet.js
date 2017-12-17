
import Entity from "./entity";
import { sin, cos } from "./utils";
import { bulletVelocity, BULLET } from "./global";

export default class Bullet extends Entity {
    constructor(owner, type, callback) {
        const dx = cos(owner.angle);
        const dy = sin(owner.angle);
        const vel = bulletVelocity(type);
        const size = (vel > 5) && (type & BULLET.FIRE) ? 2 : 1;
        super(owner.cx + dx, owner.cy + dy, size, owner.angle, vel);
        this.owner = owner;
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
    update(level, bullets, delta) {
        if (!this.alive) return;
        this.move(delta);
        if (level.collideBullet(this, (this.type & BULLET.POWER) === BULLET.POWER)) this.died();
        this.collideBullets(bullets);
    }
    collideBullets(bullets) {
        if (!this.alive) return;
        for (let i = 0; i < bullets.length; i++) {
            if (bullets[i].alive && this.collide(bullets[i], 0.5, 0.5)) {
                const myFire = !!(this.type & BULLET.FIRE);
                const otherFire = !!(bullets[i].type & BULLET.FIRE);
                if (!myFire || otherFire) this.died();
                if (!otherFire || myFire) bullets[i].died();
                return;
            }
        }
    }

    static updateBullets(level, bullets, delta) {
        bullets.forEach((bullet) => bullet.update(level, bullets, delta));

        for (let index = 0; index < bullets.length;) {
            if (bullets[index].alive) {
                index++;
            } else {
                bullets.splice(index, 1);
            }
        }
    }
}
