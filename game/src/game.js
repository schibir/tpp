
import { getMapSize } from "./utils";
import Level from "./level";
import Entity from "./entity";

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

        // updating

        // drawing
        this.level.drawEntity(this.eagle, this.level.textures.eagle);
    }
    pause() {}
}
