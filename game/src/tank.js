
import { Entity, EntityManager } from "./entity";
import Weapon from "./weapon";
import {
    TANK, STATE, PART, ITEM, BULLET,
    tankLife,
    botTypeProbability,
    angleProbability,
    tankVelocity,
    timeToRespawn,
    directionTime,
    shootTime,
    tankWeaponType,
    getScores,
    scoreToLevelup,
} from "./global";
import { sin, cos, getMapSize, clamp, Random, floatToIndex } from "./utils";
import LocalStorage from "./local_storage";

class Tank extends Entity {
    constructor(type, time, difficulty, event, level = null) {
        super(0, 0);
        this.type = type;
        this.weapon = new Weapon(this, tankWeaponType(type));
        this.life = tankLife(type);
        this.velocity = tankVelocity(type);
        this.difficulty = difficulty;
        this.event = event;
        this.smokeTime = 0;
        this.respawn(time, level);
    }
    respawn(time, level = null) {
        this.animTrack = 0;
        this.animTurret = 0;
        this.shoot = false;
        this.zombie = false;
        this.turret = new Entity(0, 0);
        this.shield = new Entity(0, 0, 3);
        this.text = {
            obj: new Entity(0, 0, 3),
            tex: 0,
            time: 0,
        };
        this.weapon.reset();
        this.state = STATE.RESPAWN;
        this.stateTime = time + 2000;     // respawn time

        const { mapWidth, mapHeight } = getMapSize();

        if (this.type <= TANK.TANK2) {
            this.angle = 0;
            this.cx = mapWidth / 2 - 5;
            this.cy = mapHeight - 3;
            if (this.type === TANK.TANK2) this.cx += 8;
            this.pendingShoot = false;
            this.pendingAngle = 0;
            this.pendingVel = 0;
        } else if (this.type === TANK.EAGLE) {
            this.cx = mapWidth / 2 - 1;
            this.cy = mapHeight - 3;
            this.state = STATE.NORMAL;
        } else {
            console.assert(this.type === TANK.RANDOM, "Should be unknown type of bot");
            console.assert(level, "Need level object for generate position of bot");
            this.type = botTypeProbability(this.difficulty);
            this.angle = 2;
            this.cy = 1;
            do {
                this.cx = Random.next((mapWidth - 4)) + 1 | 0;
            } while (level.collideTankEx(this));

            this.weapon.setType(tankWeaponType(this.type));
            this.life = tankLife(this.type);
            this.velocity = tankVelocity(this.type);
            this.vel = this.velocity;
        }
        this.dirTime = 0;
        this.shootTime = 0;
        this.changedDir = false;
        this.maxlife = this.life;
    }
    clear(level) {
        level.clearEntity(this.state === STATE.GOD ? this.shield : this);
        if (this.text.time) level.clearEntity(this.text.obj);
    }
    draw(level) {
        if (this.state === STATE.RESPAWN) {
            const ind = ((Date.now() % 800) / 50) % level.textures.respawn.length | 0;
            level.drawEntity(this, level.textures.respawn[ind]);
        } else {
            if (this.type === TANK.EAGLE) {
                level.drawEntityBegin(this, level.textures.eagle);
            } else {
                const trackIndex = (this.animTrack / 16 | 0) % level.textures.tankTrack[this.angle][TANK.BMP].length | 0;
                if (this.type <= TANK.TANK2 && this.velocity > 2) {
                    level.drawEntityBegin(this, level.textures.tankTrack[this.angle][TANK.BMP][trackIndex]);
                } else {
                    level.drawEntityBegin(this, level.textures.tankTrack[this.angle][this.type][trackIndex]);
                }
                level.drawEntityBegin(this, level.textures.tankBodies[this.angle][this.type]);
                if (this.zombie) {
                    level.drawEntityBegin(this.turret, level.textures.tankTurretFF[this.angle]);
                } else if (this.type <= TANK.TANK2 && this.weapon.type & BULLET.POWER) {
                    level.drawEntityBegin(this.turret, level.textures.tankTurretEx[this.angle][this.type]);
                } else {
                    level.drawEntityBegin(this.turret, level.textures.tankTurret[this.angle][this.type]);
                }
            }

            if (this.state === STATE.GOD) {
                const ind = floatToIndex(Math.random(), level.textures.shield.length);
                level.drawEntity(this.shield, level.textures.shield[ind]);
            }
            if (this.text.time) {
                level.drawEntityBegin(this.text.obj, level.textures.itemText[this.text.tex]);
            }
            if (this.state !== STATE.GOD) {
                level.drawEntityEnd(this);
            }
        }
    }
    update(level, tanks, time) {
        if (this.type === TANK.EAGLE) return;
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
                    this.shoot = Random.next(2) === 1;
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
                this.animTrack += delta;
            }
            this.animTurret *= 0.99;
        }
        this.turret.cx = this.cx + cos(this.angle) * this.animTurret;
        this.turret.cy = this.cy + sin(this.angle) * this.animTurret;
        this.shield.cx = this.cx;
        this.shield.cy = this.cy;
        this.text.obj.cx = this.cx;
        this.text.obj.cy = this.cy - 1.5;
        if (Date.now() > this.text.time) this.text.time = 0;
    }
    applyPendings() {
        console.assert(this.type <= TANK.TANK2);
        this.shoot = this.pendingShoot;
        this.angle = this.pendingAngle;
        this.vel = this.pendingVel;
        this.pendingShoot = false;
    }
    setText(itemType) {
        this.text.time = Date.now() + 3000;
        if (itemType > ITEM.FIREBALL) this.text.time += 3000;
        this.text.tex = itemType;
    }
    setZombie() {
        this.zombie = true;
    }
    damage(value, notify) {
        if (value < 0) this.state = STATE.DEAD;
        else if (this.state !== STATE.GOD) {
            this.life -= value;
            for (let i = 0; i < value; i++) this.weapon.dec();
            if (this.life <= 0) {
                this.state = STATE.DEAD;
                if (notify) this.event.emit("botDead", this.type);
            }
        } else if (value > 1) {
            this.state = STATE.NORMAL;
        }
    }
    upgrade(type) {
        switch (type) {
        case ITEM.STAR: {
            const old = this.weapon.type;
            this.weapon.inc();
            this.life = Math.min(this.life + 1, 6);
            this.maxlife = this.life;
            return old !== this.weapon.type;
        }
        case ITEM.SPEED: {
            const old = this.velocity;
            this.velocity = tankVelocity(TANK.BMP);
            if (this.type > TANK.TANK2) this.vel = this.velocity;
            return old < 2;
        }
        case ITEM.FIREBALL: {
            const old = this.weapon.type;
            this.weapon.setFire();
            return old !== this.weapon.type;
        }
        default: return false;
        }
    }
    updateWeapon() {
        const bullet = this.shoot ? this.weapon.shoot() : null;
        this.shoot = false;

        if (bullet) {
            this.animTurret = -0.5;
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
    constructor(difficulty, event, mode) {
        super();
        this.difficulty = clamp(difficulty, 0, 15);
        this.start_difficulty = this.difficulty;
        this.event = event;
        this.mode = mode;
        this.life = 2;
        this.scores = 0;
        this.total_scores = 0;
        if (this.mode === "level") {
            this.best_scores = LocalStorage.getBestScore(this.start_difficulty);
        }
        this.end_of_time = false;
        this.items = {
            [ITEM.FIREBALL]: false,
            [ITEM.SPEED]: false,
            [ITEM.STAR]: false,
        };

        event.on("item", (type, tank) => {
            tank.setText(type);
            switch (type) {
            case ITEM.LIFE:
                if (tank.type <= TANK.TANK2) this.life++;
                else this.life = Math.max(this.life - 1, 0);
                break;
            case ITEM.KNUKLE:
            case ITEM.ZOMBIE: {
                const isEnemy = (t) => ((t <= TANK.TANK2) !== (tank.type <= TANK.TANK2)) || (this.mode === "bench");
                const damageVal = (tank.type <= TANK.TANK2) || (this.mode === "bench") ? -1 : 1;
                this.objects.forEach((bot) => {
                    if (bot.state > STATE.RESPAWN &&
                        isEnemy(bot.type) &&
                        bot.type !== TANK.EAGLE) {
                        if (type === ITEM.KNUKLE) bot.damage(damageVal);
                        else bot.setZombie();
                    }
                });
                break;
            }
            case ITEM.STAR:
            case ITEM.SPEED:
            case ITEM.FIREBALL: {
                const upgraded = tank.upgrade(type);
                if (!upgraded && tank.type <= TANK.TANK2) this.items[type] = true;
                break;
            }
            default: break;
            }
        });
        event.on("botDead", (type) => {
            this.scores += getScores(type);
            this.total_scores += getScores(type);
            if (this.mode === "level") {
                this.best_scores = LocalStorage.setBestScore(this.start_difficulty, this.total_scores);
            }
            if (this.scores > scoreToLevelup(this.difficulty)) {
                this.difficulty = Math.min(this.difficulty + 1, 15);
                this.scores = 0;
                this.objects.forEach((tank) => {
                    if (tank.type <= TANK.TANK2) tank.setText(ITEM.FIREBALL + this.difficulty + 1);
                });
                event.emit("levelup", this.difficulty);
            }
        });
        event.on("endOfTime", () => {
            this.end_of_time = this.mode !== "bench";
        });
    }
    create(type, time = 0, level = null) {
        const tank = new Tank(type, time, this.difficulty, this.event, level);
        this.objects.push(tank);
        return tank;
    }
    reset() {
        this.objects = this.objects.filter((tank) => tank.type <= TANK.TANK2);
        this.objects.forEach((tank) => tank.respawn(0));
        this.create(TANK.EAGLE);

        this.timeRespawn = 0;
        this.end_of_time = false;
        this.end = false;
    }
    draw(level, progress) {
        super.draw(level);
        level.drawInterface(this.life,
            this.items[ITEM.FIREBALL],
            this.items[ITEM.SPEED],
            this.items[ITEM.STAR],
            this.mode === "bench" ? 1 : progress,
            ITEM.FIREBALL + this.difficulty + 1,
            this.total_scores,
            this.best_scores);
    }
    update(level, bullets, time) {
        if (this.end) return;
        if (time > this.timeRespawn && !this.end_of_time) {
            this.timeRespawn = time + timeToRespawn(this.difficulty);
            this.create(TANK.RANDOM, time, level);
        }

        if (this.end_of_time) {
            let countBots = 0;
            this.objects.forEach((tank) => {
                if (tank.type > TANK.TANK2 && tank.type < TANK.RANDOM) countBots++;
            });
            if (countBots === 0) {
                this.end = true;
                this.event.emit("levelComplete");
            }
        }

        for (let i = 0; i < this.objects.length; i++) {
            const tank = this.objects[i];
            if (tank.state === STATE.DEAD) {
                this.event.emit("tankDead", tank);
                if (tank.type <= TANK.TANK2) {
                    if (this.life > 0) {
                        this.life--;
                        const player = this.create(tank.type, time);
                        this.event.emit("playerCreated", player);

                        // upgrade
                        for (let type = ITEM.LIFE; type <= ITEM.FIREBALL; type++) {
                            if (type in this.items) {
                                if (this.items[type]) {
                                    player.upgrade(type);
                                    this.items[type] = false;
                                }
                            }
                        }
                    } else if (this.mode !== "bench") {
                        this.event.emit("gameOver");
                    }
                } else if (tank.type === TANK.EAGLE) {
                    this.event.emit("gameOver");
                }
                tank.alive = false;
            }
            tank.update(level, this.objects, time);
            const bullet = tank.updateWeapon();
            if (bullet) {
                bullets.add(bullet);
            }

            bullets.collideTank(tank);

            // smoke
            if (tank.state !== STATE.DEAD && tank.life < tank.maxlife && (Date.now() > tank.smokeTime)) {
                tank.smokeTime = Date.now() + 16;
                let smoke = PART.SMOKE0;
                if (tank.life === 1) smoke = PART.SMOKE3;
                else if (tank.maxlife - tank.life === 1) smoke = PART.SMOKE0;
                else if (tank.life / tank.maxlife > 0.5) smoke = PART.SMOKE1;
                else smoke = PART.SMOKE2;
                this.event.emit("particle", tank.cx, tank.cy, smoke);
            }
        }

        this.splice();
    }
}
