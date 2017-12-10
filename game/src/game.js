
import { getMapSize } from "./utils";
import Level from "./level";
import Entity from "./entity";
import { Tank, TANK } from "./tank";

export default class Game {
    constructor(difficulty, canvas, mode = "level") {
        this.currentDifficulty = difficulty;
        this.currentLevel = 1;
        this.canvas = canvas;
        this.mode = mode;

        const { mapWidth, mapHeight } = getMapSize();
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board

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

        // clearing
        this.level.clearEntity(this.eagle);
        this.level.clearEntity(this.tempTank);

        // updating

        // drawing
        this.level.drawEntity(this.eagle, this.level.textures.eagle);
        this.tempTank.draw(this.level);
    }
    pause() {}
}
