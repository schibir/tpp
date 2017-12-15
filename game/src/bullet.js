
import Entity from "./entity";

export const BULLET = {
    SIMPLE: 0,
    SINGLE: 1,
    DOUBLE: 2,
    POWER: 3,
    FIRE: 4,
};

export class Bullet extends Entity {
    constructor(owner) {
        super(owner.cx, owner.cy, 1, owner.angle, 0.1);
        this.owner = owner;
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
    died() {
        this.owner.weapon.count++;
    }

    static updateBullets(level, bullets, delta) {
        for (let index = 0; index < bullets.length;) {
            const bullet = bullets[index];
            if (bullet.update(level, delta)) {
                index++;
            } else {
                bullet.died();
                bullets.splice(index, 1);
            }
        }
    }
}
