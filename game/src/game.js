
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
    constructor(difficulty, canvas, mode = "level") {
        // common game settings
        this.currentDifficulty = difficulty;
        this.currentLevel = 1;
        this.canvas = canvas;
        this.mode = mode;

        const { mapWidth, mapHeight } = getMapSize();
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board
        this.lastTime = Date.now();

        // player settings
        this.keyMask = [0, 0];
        this.shootKeyPress = [false, false];

        this.tanks = new TankManager();
        this.bullets = new BulletManager();
        this.particles = new ParticleManager();

        this.eagle = new Entity(this.mapWidth * 0.5, this.mapHeight - 1);
        this.tanks.create(10, 10, TANK.TANK1);
        this.tanks.create(15, 10, TANK.TANK2);
        this.players = [this.tanks.objects[0], this.tanks.objects[1]];

        this.newLevel();
    }
    newLevel() {
        let levelName = `levels/${this.mode}`;
        if (this.mode === "level") levelName += `${this.currentLevel}`;

        this.level = new Level(levelName, this.canvas);
    }
    update() {
        if (!this.level.ready()) return;

        const time = Date.now();
        const delta = time - this.lastTime;
        this.lastTime = time;

        this.level.update();

        // clearing
        this.level.clearEntity(this.eagle);
        this.tanks.clear(this.level);
        this.bullets.clear(this.level);
        this.particles.clear(this.level);

        // updating
        this.tanks.update(this.level, this.bullets, delta);
        this.bullets.update(this.level, delta);
        this.particles.update(this.level, delta);

        // drawing
        this.level.drawEntity(this.eagle, this.level.textures.eagle);
        this.tanks.draw(this.level);
        this.bullets.draw(this.level);
        this.particles.draw(this.level);
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
