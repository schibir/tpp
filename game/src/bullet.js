
import Entity from "./entity";
import { sin, cos } from "./utils";

export default class Bullet extends Entity {
    constructor(owner, callback) {
        const dx = cos(owner.angle);
        const dy = sin(owner.angle);
        super(owner.cx + dx, owner.cy + dy, 1, owner.angle, 2.88);
        this.owner = owner;
        this.callback = callback;
    }
    clear(level) {
        level.clearEntity(this);
    }
    draw(level) {
        level.drawEntity(this, level.textures.bullet);
    }
    update(level, delta) {
        this.move(delta);
        return !level.collideBullet(this);
    }

    static updateBullets(level, bullets, delta) {
        for (let index = 0; index < bullets.length;) {
            const bullet = bullets[index];
            if (bullet.update(level, delta)) {
                index++;
            } else {
                bullet.callback();
                bullets.splice(index, 1);
            }
        }
    }
}
