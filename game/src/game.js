
import Level from "./level";

export default class Game {
    constructor(difficulty, canvas, mode = "level") {
        this.currentDifficulty = difficulty;
        this.currentLevel = 1;
        this.canvas = canvas;
        this.mode = mode;

        this.newLevel();
    }
    newLevel() {
        let levelName = `levels/${this.mode}`;
        if (this.mode === "level") levelName += `${this.currentLevel}`;

        this.level = new Level(levelName, this.canvas);
    }
    update() {}
    pause() {}
}
