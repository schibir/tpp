
import { getMapSize } from "./utils";
import Level from "./level";
import Entity from "./entity";
import Tank from "./tank";
import Bullet from "./bullet";
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

        this.eagle = new Entity(this.mapWidth * 0.5, this.mapHeight - 1);
        this.players = [new Tank(10, 10, TANK.TANK1), new Tank(15, 10, TANK.TANK2)];

        this.tanks = [this.players[0], this.players[1]];
        this.bullets = [];

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
        this.tanks.forEach((tank) => tank.clear(this.level));
        this.bullets.forEach((bullet) => bullet.clear(this.level));

        // updating
        Tank.updateTanks(this.level, this.tanks, this.bullets, delta);
        Bullet.updateBullets(this.level, this.bullets, delta);

        // drawing
        this.level.drawEntity(this.eagle, this.level.textures.eagle);
        this.tanks.forEach((tank) => tank.draw(this.level));
        this.bullets.forEach((bullet) => bullet.draw(this.level));
    }
    onkeydown(key) {
        for (let p = 0; p < 2; p++) {
            if (this.players[p] && key in keyToAngle[p]) {
                this.players[p].angle = keyToAngle[p][key];
                this.players[p].vel = 0.05;
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
            if (this.players[p]) {
                if (key in keyToAngle[p]) {
                    this.keyMask[p] ^= 1 << keyToAngle[p][key];
                }
                if (this.keyMask[p] in maskToAngle) {
                    this.players[p].angle = maskToAngle[this.keyMask[p]];
                } else {
                    this.players[p].vel = 0;
                }
                this.shootKeyPress[p] = false;
            }
        }
    }
}
