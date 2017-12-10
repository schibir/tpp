
import { getMapSize } from "./utils";
import Level from "./level";
import Entity from "./entity";
import { Tank, TANK } from "./tank";

const KEY_UP_1 = 38;
const KEY_RIGHT_1 = 39;
const KEY_DOWN_1 = 40;
const KEY_LEFT_1 = 37;
const KEY_SHOOT_1 = " ".charCodeAt(0);
const KEY_UP_2 = "W".charCodeAt(0);
const KEY_RIGHT_2 = "D".charCodeAt(0);
const KEY_DOWN_2 = "S".charCodeAt(0);
const KEY_LEFT_2 = "A".charCodeAt(0);
const KEY_SHOOT_2 = " ".charCodeAt(0);  // temporary key code

export default class Game {
    constructor(difficulty, canvas, mode = "level") {
        this.currentDifficulty = difficulty;
        this.currentLevel = 1;
        this.canvas = canvas;
        this.mode = mode;

        const { mapWidth, mapHeight } = getMapSize();
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board
        this.lastTime = Date.now();

        this.eagle = new Entity(this.mapWidth * 0.5, this.mapHeight - 1);
        this.tempTank = new Tank(10, 10, TANK.TANK1);

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

        // clearing
        this.level.clearEntity(this.eagle);
        this.tempTank.clear(this.level);

        // updating
        this.tempTank.update(delta);

        // drawing
        this.level.drawEntity(this.eagle, this.level.textures.eagle);
        this.tempTank.draw(this.level);
    }
    pause() {}
    onkeydown(key) {
        if (key === KEY_UP_1) {
            this.tempTank.angle = 0;
            this.tempTank.vel = 0.05;
        }
        if (key === KEY_RIGHT_1) {
            this.tempTank.angle = 1;
            this.tempTank.vel = 0.05;
        }
        if (key === KEY_DOWN_1) {
            this.tempTank.angle = 2;
            this.tempTank.vel = 0.05;
        }
        if (key === KEY_LEFT_1) {
            this.tempTank.angle = 3;
            this.tempTank.vel = 0.05;
        }
    }
    onkeyup(key) {
        if (key === KEY_UP_1) {
            this.tempTank.vel = 0;
        }
        if (key === KEY_RIGHT_1) {
            this.tempTank.vel = 0;
        }
        if (key === KEY_DOWN_1) {
            this.tempTank.vel = 0;
        }
        if (key === KEY_LEFT_1) {
            this.tempTank.vel = 0;
        }
    }
}
