
import Level from "./level";

export default class Game {
    constructor(difficulty, canvas) {
        this.currentDifficulty = difficulty;
        this.currentLevel = 1;
        this.canvas = canvas;

        this.newLevel();
    }
    newLevel() {
        const test = "test";
        const bench = "bench";
        const level = "level";

        let levelName = "levels/";
        if (this.currentDifficulty === -2) levelName += test;
        else if (this.currentDifficulty === -1) levelName += bench;
        else levelName += `${level}${this.currentLevel}`;

        this.level = new Level(levelName, this.canvas);
    }
    update() {}
    pause() {}
}
