
import Entity from "./entity";
import Weapon from "./weapon";
import { BULLET } from "./global";
import { sin, cos } from "./utils";

export default class Tank extends Entity {
    constructor(cx, cy, type) {
        super(cx, cy);
        this.type = type;
        this.animTrack = 0;
        this.animTurret = 0;
        this.turret = new Entity(cx, cy);
        this.weapon = new Weapon(this, BULLET.SIMPLE);
        this.shoot = false;
    }
    clear(level) {
        level.clearEntity(this);
    }
    draw(level) {
        level.drawEntityBegin(this, level.textures.tankTrack[this.angle][this.type][this.animTrack]);
        level.drawEntityBegin(this, level.textures.tankBodies[this.angle][this.type]);
        level.drawEntityBegin(this.turret, level.textures.tankTurret[this.angle][this.type]);
        level.drawEntityEnd(this);
    }
    update(level, delta) {
        if (this.angle === 0 || this.angle === 2) this.cx = Math.round(this.cx);
        if (this.angle === 1 || this.angle === 3) this.cy = Math.round(this.cy);

        this.move(delta);
        if (level.collideTank(this)) this.move(-delta);
        else if (this.vel > 0.01) {
            this.animTrack = ++this.animTrack % level.textures.tankTrack[this.angle][this.type].length | 0;
        }

        this.turret.cx = this.cx + cos(this.angle) * this.animTurret;
        this.turret.cy = this.cy + sin(this.angle) * this.animTurret;
        this.animTurret *= 0.9;
    }
    updateWeapon() {
        const bullet = this.shoot ? this.weapon.shoot() : null;
        this.shoot = false;

        if (bullet) {
            this.animTurret = -0.3;
        }
        return bullet;
    }

    static updateTanks(level, tanks, bullets, delta) {
        for (let index = 0; index < tanks.length; index++) {
            const tank = tanks[index];
            tank.update(level, delta);
            const bullet = tank.updateWeapon();
            if (bullet) {
                bullets.push(bullet);
            }
        }
    }
}
