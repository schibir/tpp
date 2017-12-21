
import { getMapSize } from "./utils";
import Level from "./level";
import { Entity } from "./entity";
import TankManager from "./tank";
import { BulletManager } from "./bullet";
import ParticleManager from "./particle";
import { TANK } from "./global";

const keyToAngle = [{
    38: 0,  // UP
    39: 1,  // RIGHT
    40: 2,  // DOWN
    37: 3,  // LEFT
}, {
    ["W".charCodeAt(0)]: 0,  // UP
    ["D".charCodeAt(0)]: 1,  // RIGHT
    ["S".charCodeAt(0)]: 2,  // DOWN
    ["A".charCodeAt(0)]: 3,  // LEFT
}];
const maskToAngle = {
    1: 0,
    2: 1,
    4: 2,
    8: 3,
};
const keyShoot = [
    " ".charCodeAt(0),
    "Q".charCodeAt(0),
];

export default class Game {
    constructor(canvas, params) {
        // common game settings
        this.currentDifficulty = parseInt(params.difficulty);
        this.currentLevel = 1;
        this.canvas = canvas;
        this.mode = params.mode;

        const { mapWidth, mapHeight } = getMapSize();
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board

        this.particles = new ParticleManager();
        this.tanks = new TankManager();
        this.bullets = new BulletManager(this.particles);

        this.eagle = new Entity(this.mapWidth * 0.5, this.mapHeight - 1);
        const tank1 = this.tanks.create(TANK.TANK1);
        const tank2 = params.twoplayers === "true" ? this.tanks.create(TANK.TANK2) : null;
        this.players = [tank1, tank2];

        this.newLevel();
    }
    newLevel() {
        let levelName = `levels/${this.mode}`;
        if (this.mode === "level") levelName += `${this.currentLevel}`;

        this.level = new Level(levelName, this.canvas, this.particles, () => {
            this.particles.reset();
            this.tanks.reset(Date.now());
            this.bullets.reset();
            this.pauseTime = 0;
            this.startPauseTime = 0;

            // player settings
            this.keyMask = [0, 0];
            this.shootKeyPress = [false, false];
        });
    }
    update() {
        if (!this.level.ready()) return;

        const timeOffset = this.startPauseTime ? Date.now() - this.startPauseTime : 0
        const currentTime = Date.now() - this.pauseTime - timeOffset;

        this.level.update();

        // clearing
        this.level.clearEntity(this.eagle);
        this.tanks.clear(this.level);
        this.bullets.clear(this.level);
        this.particles.clear(this.level);

        // updating
        this.tanks.update(this.level, this.bullets, currentTime);
        this.bullets.update(this.level, currentTime);
        this.particles.update(this.level, currentTime);

        // drawing
        this.level.drawEntity(this.eagle, this.level.textures.eagle);
        this.particles.draw(this.level);
        this.tanks.draw(this.level);
        this.bullets.draw(this.level);
    }
    onkeydown(key) {
        for (let p = 0; p < 2; p++) {
            if (this.players[p] && key in keyToAngle[p]) {
                this.players[p].angle = keyToAngle[p][key];
                this.players[p].vel = 1.5;
                this.keyMask[p] |= 1 << keyToAngle[p][key];
            }
            if (this.players[p] && key === keyShoot[p]) {
                this.players[p].shoot = !this.shootKeyPress[p];
                this.shootKeyPress[p] = true;
            }
        }

        if (key === "N".charCodeAt(0)) this.newLevel();
        if (key === "P".charCodeAt(0)) {
            if (this.startPauseTime) {
                this.pauseTime += Date.now() - this.startPauseTime;
                this.startPauseTime = 0;
            }
            else this.startPauseTime = Date.now();
        }
    }
    onkeyup(key) {
        for (let p = 0; p < 2; p++) {
            if (this.players[p] && key in keyToAngle[p]) {
                this.keyMask[p] ^= 1 << keyToAngle[p][key];
                if (this.keyMask[p] in maskToAngle) {
                    this.players[p].angle = maskToAngle[this.keyMask[p]];
                } else {
                    this.players[p].vel = 0;
                }
            }
            if (this.players[p] && key === keyShoot[p]) {
                this.shootKeyPress[p] = false;
            }
        }
    }
}
