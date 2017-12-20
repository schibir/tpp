
import { Entity, EntityManager } from "./entity";
import Weapon from "./weapon";
import { BULLET, TANK, STATE } from "./global";
import { sin, cos, getMapSize } from "./utils";

class Tank extends Entity {
    constructor(type) {
        super(0, 0);
        this.type = type;
        this.weapon = new Weapon(this, type === 0 ? BULLET.SIMPLE | BULLET.FIRE : BULLET.SIMPLE);
        this.respawn();
    }
    respawn() {
        this.animTrack = 0;
        this.animTurret = 0;
        this.shoot = false;
        this.alive = true;
        this.turret = new Entity(0, 0);
        this.shield = new Entity(0, 0, 3);
        this.weapon.reset();
        this.state = STATE.RESPAWN;
        this.stateTime = Date.now() + 2000;     // respawn time

        const { mapWidth, mapHeight } = getMapSize();

        if (this.type <= TANK.TANK2) {
            this.angle = 0;
            this.cx = mapWidth / 2 - 5;
            this.cy = mapHeight - 3;
            if (this.type === TANK.TANK2) this.cx += 8
        }
    }
    clear(level) {
        level.clearEntity(this.state === STATE.GOD ? this.shield : this);
    }
    draw(level) {
        if (this.state === STATE.RESPAWN) {
            const ind = ((Date.now() % 800) / 50) % level.textures.respawn.length | 0;
            level.drawEntity(this, level.textures.respawn[ind]);
        } else {
            level.drawEntityBegin(this, level.textures.tankTrack[this.angle][this.type][this.animTrack]);
            level.drawEntityBegin(this, level.textures.tankBodies[this.angle][this.type]);
            level.drawEntityBegin(this.turret, level.textures.tankTurret[this.angle][this.type]);

            if (this.state === STATE.GOD) {
                const ind = Math.random() * level.textures.shield.length | 0;
                level.drawEntity(this.shield, level.textures.shield[ind]);
            } else {
                level.drawEntityEnd(this);
            }
        }
    }
    update(level, tanks, delta) {
        if (this.state === STATE.RESPAWN) {
            if (Date.now() > this.stateTime) {
                this.state = STATE.GOD;
                this.stateTime = Date.now() + 3000;     // time GOD;
            }
            this.shoot = false;
        } else {
            if (this.state === STATE.GOD) {
                if (Date.now() > this.stateTime) this.state = STATE.NORMAL;
            }

            if (this.angle === 0 || this.angle === 2) this.cx = Math.round(this.cx);
            if (this.angle === 1 || this.angle === 3) this.cy = Math.round(this.cy);

            this.move(delta);
            if (level.collideTank(this) ||
                this.collideTanks(tanks)) this.move(-delta);
            else if (this.vel > 0.01) {
                this.animTrack = ++this.animTrack % level.textures.tankTrack[this.angle][this.type].length | 0;
            }

        }
        this.turret.cx = this.cx + cos(this.angle) * this.animTurret;
        this.turret.cy = this.cy + sin(this.angle) * this.animTurret;
        this.shield.cx = this.cx;
        this.shield.cy = this.cy;
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
    collideTanks(tanks) {
        const cx = Math.round(this.cx);
        const cy = Math.round(this.cy);
        for (let i = 0; i < tanks.length; i++) {
            const tank = tanks[i];
            if (tank !== this && tank.state > STATE.RESPAWN) {
                const tx = Math.round(tank.cx);
                const ty = Math.round(tank.cy);
                if (Math.abs(cx - tx) < 2 &&
                    Math.abs(cy - ty) < 2) return tank;
            }
        }
        return null;
    }
}

export default class TankManager extends EntityManager {
    create(cx, cy, type) {
        const tank = new Tank(cx, cy, type);
        this.objects.push(tank);
        return tank;
    }
    reset() {
        this.objects = this.objects.filter((tank) => tank.type <= TANK.TANK2);
        this.objects.forEach((tank) => tank.respawn());
    }
    update(level, bullets, delta) {
        this.objects.forEach((tank) => {
            tank.update(level, this.objects, delta);
            const bullet = tank.updateWeapon();
            if (bullet) {
                bullets.add(bullet);
            }

            bullets.collideTank(tank);
        });

        this.splice();
    }
}
