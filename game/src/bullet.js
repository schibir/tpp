
import { Entity, EntityManager } from "./entity";
import { sin, cos } from "./utils";
import { bulletDamage, bulletVelocity, tankRadius, BULLET, PART, STATE } from "./global";

export class Bullet extends Entity {
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
        this.particleCallback = () => {};
    }
    setParticleCallback(callback) {
        this.particleCallback = callback;
    }
    died() {
        if (this.alive) {
            this.particleCallback(this);
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
    update(level, time) {
        if (!this.alive) return;
        this.move(this.getDelta(time));
        if (level.collideBullet(this, (this.type & BULLET.POWER) === BULLET.POWER)) this.died();
    }
}

export class BulletManager extends EntityManager {
    constructor(event) {
        super();

        this.particleCallback = (bullet) => {
            event.emit("particle", bullet.cx, bullet.cy, bullet.type & BULLET.FIRE ? PART.FIRE : PART.SPARK);
        };
    }
    add(bullet) {
        bullet.setParticleCallback(this.particleCallback);
        this.objects.push(bullet);
    }
    collideTank(tank) {
        if (tank.state <= STATE.RESPAWN) return;
        this.objects.forEach((bullet) => {
            if (!bullet.alive || bullet.owner === tank) return;
            if (tank.collide(bullet, tankRadius(tank.type), 0.5)) {
                bullet.died();

                const table = [0, 0, 1, 1, 1, 1, 1];
                if (table[bullet.owner.type] !== table[tank.type]) {
                    tank.damage(bulletDamage(bullet.type));
                }
            }
        });
    }
    update(level, time) {
        const collide = (bullet) => {
            if (!bullet.alive) return;
            for (let i = 0; i < this.objects.length; i++) {
                if (this.objects[i].alive && bullet.collide(this.objects[i], 0.5, 0.5)) {
                    const myFire = !!(bullet.type & BULLET.FIRE);
                    const otherFire = !!(this.objects[i].type & BULLET.FIRE);
                    if (!myFire || otherFire) bullet.died();
                    else bullet.particleCallback(bullet);
                    if (!otherFire || myFire) this.objects[i].died();
                    else this.objects[i].particleCallback(this.objects[i]);
                    return;
                }
            }
        };

        this.objects.forEach((bullet) => collide(bullet));
        super.update(level, time);
    }
}
