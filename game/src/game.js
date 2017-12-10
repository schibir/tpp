
import { getMapSize } from "./utils";
import Level from "./level";
import Entity from "./entity";
import { Tank, TANK } from "./tank";

const KEY_PLAYER_ONE = {
    38: 0,  // UP
    39: 1,  // RIGHT
    40: 2,  // DOWN
    37: 3,  // LEFT
};
const KEY_PLAYER_TWO = {
    ["W".charCodeAt(0)]: 0,  // UP
    ["D".charCodeAt(0)]: 1,  // RIGHT
    ["S".charCodeAt(0)]: 2,  // DOWN
    ["A".charCodeAt(0)]: 3,  // LEFT
};

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
        if (key in KEY_PLAYER_ONE) {
            this.tempTank.angle = KEY_PLAYER_ONE[key];
            this.tempTank.vel = 0.05;
        }
    }
    onkeyup(key) {
        if (key in KEY_PLAYER_ONE) {
            this.tempTank.vel = 0;
        }
    }
}
