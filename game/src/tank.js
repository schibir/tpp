
import { Entity, EntityManager } from "./entity";
import Weapon from "./weapon";
import {
    TANK, STATE,
    tankLife,
    botTypeProbability,
    angleProbability,
    tankVelocity,
    timeToRespawn,
    directionTime,
    shootTime,
    tankWeaponType,
} from "./global";
import { sin, cos, getMapSize, clamp } from "./utils";

class Tank extends Entity {
    constructor(type, time, difficulty, level = null) {
        super(0, 0);
        this.type = type;
        this.weapon = new Weapon(this, tankWeaponType(type));
        this.life = tankLife(type);
        this.velocity = tankVelocity(type);
        this.difficulty = difficulty;
        this.respawn(time, level);
    }
    respawn(time, level = null) {
        this.animTrack = 0;
        this.animTurret = 0;
        this.shoot = false;
        this.alive = true;
        this.turret = new Entity(0, 0);
        this.shield = new Entity(0, 0, 3);
        this.weapon.reset();
        this.state = STATE.RESPAWN;
        this.stateTime = time + 2000;     // respawn time

        const { mapWidth, mapHeight } = getMapSize();

        if (this.type <= TANK.TANK2) {
            this.angle = 0;
            this.cx = mapWidth / 2 - 5;
            this.cy = mapHeight - 3;
            if (this.type === TANK.TANK2) this.cx += 8;
        } else {
            console.assert(this.type === TANK.RANDOM, "Should be unknown type of bot");
            console.assert(level, "Need level object for generate position of bot");
            this.type = botTypeProbability(this.difficulty);
            this.angle = 2;
            this.cy = 1;
            do {
                this.cx = Math.random() * (mapWidth - 4) + 1 | 0;
            } while (level.collideTankEx(this));

            this.weapon.setType(tankWeaponType(this.type));
            this.life = tankLife(this.type);
            this.velocity = tankVelocity(this.type);
            this.vel = this.velocity;
        }
        this.dirTime = 0;
        this.shootTime = 0;
        this.changedDir = false;
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
    update(level, tanks, time) {
        if (this.state === STATE.RESPAWN) {
            if (time > this.stateTime) {
                this.state = STATE.GOD;
                this.stateTime = time + 3000;     // time GOD;
                this.shootTime = time + shootTime(this.difficulty);

                for (let tank = this.collideTanks(tanks); tank; tank = this.collideTanks(tanks)) {
                    tank.damage(-1);
                }
            }
            this.shoot = false;
        } else {
            if (this.state === STATE.GOD) {
                if (time > this.stateTime) this.state = STATE.NORMAL;
            }

            if (this.type > TANK.TANK2) {
                // AI
                if (time > this.dirTime) {
                    this.dirTime = time + directionTime(false);
                    this.angle = angleProbability();
                    this.changedDir = true;
                }
                if (time > this.shootTime) {
                    this.shootTime = time + shootTime(this.difficulty);
                    this.shoot = Math.random() < 0.5;
                }
            }

            if (this.angle === 0 || this.angle === 2) this.cx = Math.round(this.cx);
            if (this.angle === 1 || this.angle === 3) this.cy = Math.round(this.cy);

            const delta = this.getDelta(time);
            this.move(delta);
            if (level.collideTank(this) || this.collideTanks(tanks)) {
                this.move(-delta);
                if (this.changedDir) {
                    this.dirTime = time + directionTime(true);
                    this.changedDir = false;
                }
            } else if (this.vel > 0.01) {
                this.animTrack = ++this.animTrack % level.textures.tankTrack[this.angle][this.type].length | 0;
            }
        }
        this.turret.cx = this.cx + cos(this.angle) * this.animTurret;
        this.turret.cy = this.cy + sin(this.angle) * this.animTurret;
        this.shield.cx = this.cx;
        this.shield.cy = this.cy;
        this.animTurret *= 0.9;
    }
    damage(value) {
        if (value < 0) this.state = STATE.DEAD;
        else if (this.state !== STATE.GOD) {
            this.life -= value;
            for (let i = 0; i < value; i++) this.weapon.dec();
            if (this.life <= 0) this.state = STATE.DEAD;
        }
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
    constructor(difficulty, event) {
        super();
        this.difficulty = clamp(difficulty, 0, 15);
        this.event = event;
    }
    create(type, time = 0, level = null) {
        const tank = new Tank(type, time, this.difficulty, level);
        this.objects.push(tank);
        return tank;
    }
    reset(time) {
        this.objects = this.objects.filter((tank) => tank.type <= TANK.TANK2);
        this.objects.forEach((tank) => tank.respawn(time));

        this.timeRespawn = 0;
    }
    update(level, bullets, time) {
        if (time > this.timeRespawn) {
            this.timeRespawn = time + timeToRespawn(this.difficulty);
            this.create(TANK.RANDOM, time, level);
        }

        for (let i = 0; i < this.objects.length; i++) {
            const tank = this.objects[i];
            if (tank.state === STATE.DEAD) {
                if (tank.type <= TANK.TANK2) {
                    this.objects[i] = this.create(tank.type, time);
                    this.event.emit("playerCreated", this.objects[i]);
                } else tank.alive = false;
            }
            tank.update(level, this.objects, time);
            const bullet = tank.updateWeapon();
            if (bullet) {
                bullets.add(bullet);
            }

            bullets.collideTank(tank);
        }

        this.splice();
    }
}
