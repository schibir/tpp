
import Entity from "./entity";
import { sin, cos } from "./utils";

export default class Bullet extends Entity {
    constructor(owner, callback) {
        const dx = cos(owner.angle);
        const dy = sin(owner.angle);
        super(owner.cx + dx, owner.cy + dy, 1, owner.angle, 2.88);
        this.owner = owner;
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
        level.drawEntity(this, level.textures.bullet);
    }
    update(level, bullets, delta) {
        if (!this.alive) return;
        this.move(delta);
        if (level.collideBullet(this)) this.died();
        this.collideBullets(bullets);
    }
    collideBullets(bullets) {
        if (!this.alive) return;
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (bullet !== this && bullet.alive) {
                if (Math.abs(this.cx - bullet.cx) <= 0.5 &&
                    Math.abs(this.cy - bullet.cy) <= 0.5) {
                    this.died();
                    bullet.died();
                    return;
                }
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
