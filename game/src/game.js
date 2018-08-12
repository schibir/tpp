
import { getMapSize, getTileSize } from "./utils";
import { Level, Layer } from "./level";
import { Entity } from "./entity";
import TankManager from "./tank";
import { BulletManager } from "./bullet";
import ParticleManager from "./particle";
import { TANK, LEVEL_TIME } from "./global";
import Event from "./event";
import ItemManager from "./item";
import Replay from "./replay";

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
const angleToKey = {
    0: 38,  // UP
    1: 39,  // RIGHT
    2: 40,  // DOWN
    3: 37,  // LEFT
};

class Menu {
    constructor(text, width, height) {
        const { mapWidth, mapHeight } = getMapSize();
        const size = getTileSize(width, height);
        this.entity = new Entity((mapWidth - 1) / 2, (mapHeight - 1) / 2, 12);
        this.layer = new Layer(this.entity.size * size, this.entity.size * size);

        const ctx = this.layer.context;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "rgb(193, 156, 34)";
        ctx.fillRect(0, 4 * size, this.layer.canvas.width, this.layer.canvas.height - 8 * size);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgb(198, 205, 242)";
        ctx.textAlign = "center";
        ctx.font = `${size * 2 | 0}px Verdana, Geneva, Arial, Helvetica, sans-serif`;
        ctx.fillText(text, this.layer.canvas.width / 2, this.layer.canvas.height / 2 + size / 2);
    }
}

export default class Game {
    constructor(canvas, params) {
        // common game settings
        const currentDifficulty = parseInt(params.difficulty, 10);
        this.currentLevel = 0;
        this.canvas = canvas;
        this.mode = params.mode;

        const { mapWidth, mapHeight } = getMapSize();
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board

        this.event = new Event();
        this.particles = new ParticleManager(this.event);
        this.tanks = new TankManager(currentDifficulty, this.event, this.mode);
        this.bullets = new BulletManager(this.event, this.mode);
        this.items = new ItemManager(currentDifficulty, this.event, this.mode);

        this.pauseMenu = new Menu("Pause", canvas.width, canvas.height);
        this.loadMenu = new Menu("Loading", canvas.width, canvas.height);
        this.gameoverMenu = new Menu("Game Over", canvas.width, canvas.height);
        this.menu = null;
        this.level = null;
        this.replay = null;
        this.drawLoading = false;
        this.gameover = false;

        const tank1 = this.tanks.create(TANK.TANK1);
        const tank2 = params.twoplayers === "true" ? this.tanks.create(TANK.TANK2) : null;
        this.players = [tank1, tank2];

        this.event.on("levelCreated", () => {
            // replay
            if (this.mode === "level") {
                this.replay = new Replay(this.currentLevel, this.tanks);
            }

            // game
            this.startLevelTime = Date.now();
            this.updateTime = 0;
            this.particles.reset();
            this.tanks.reset();
            this.bullets.reset();
            this.items.reset();
            this.pauseTime = 0;
            this.startPauseTime = 0;
            this.drawLoading = false;

            // player settings
            this.keyMask = [0, 0];
            this.shootKeyPress = [false, false];
            this.axes = [false, false, false, false];
        });
        this.event.on("playerCreated", (tank) => {
            this.players[tank.type] = tank;
        });
        this.event.on("gameOver", () => {
            this.pause();
            this.gameover = true;
            if (this.replay) this.replay.save();
        });
        this.event.on("levelComplete", () => {
            if (this.replay) this.replay.save();
            setTimeout(() => {
                this.currentLevel = (this.currentLevel + 1) % 6 | 0;
                this.level = null;
            }, 500);
        });
    }
    newLevel() {
        let levelName = `levels/${this.mode}`;
        if (this.mode === "level") levelName += `${this.currentLevel}`;

        this.level = new Level(levelName, this.canvas, this.event);
    }
    update() {
        if (!this.level) {
            if (!this.drawLoading) {
                const x = this.canvas.width / 2 - this.loadMenu.layer.canvas.width / 2;
                const y = this.canvas.height / 2 - this.loadMenu.layer.canvas.height / 2;
                this.canvas.getContext("2d").drawImage(this.loadMenu.layer.canvas, x, y);
                this.drawLoading = true;
            } else {
                this.newLevel();
            }
        }
        if (!this.level || !this.level.ready()) return;

        const timeOffset = this.startPauseTime ? Date.now() - this.startPauseTime : 0;
        const currentTime = Date.now() - this.pauseTime - timeOffset - this.startLevelTime;

        if (currentTime > LEVEL_TIME) this.event.emit("endOfTime");

        // clearing
        if (this.menu) this.level.clearEntity(this.menu.entity);
        this.tanks.clear(this.level);
        this.bullets.clear(this.level);
        this.particles.clear(this.level);
        this.items.clear(this.level);

        // updating
        while (currentTime >= this.updateTime) {
            if (this.replay) this.replay.processPlayers(this.players);
            this.tanks.update(this.level, this.bullets, this.updateTime);
            this.bullets.update(this.level, this.updateTime);
            this.items.update(this.level, this.tanks, this.updateTime);
            this.updateTime += 16;
        }

        this.particles.update(this.level);

        if (this.startPauseTime) this.menu = this.pauseMenu;
        else this.menu = null;
        if (this.gameover) this.menu = this.gameoverMenu;

        // drawing
        this.particles.draw(this.level, 0);
        this.tanks.draw(this.level, Math.max((LEVEL_TIME - currentTime) / LEVEL_TIME, 0));
        this.bullets.draw(this.level);
        this.particles.draw(this.level, 1);
        this.items.draw(this.level);

        // draw menu
        if (this.menu) {
            this.level.drawEntityBegin(this.menu.entity, this.menu.layer.canvas);
        }
    }
    pause() {
        if (this.gameover) return;
        if (this.startPauseTime) {
            this.pauseTime += Date.now() - this.startPauseTime;
            this.startPauseTime = 0;
        } else this.startPauseTime = Date.now();
    }
    onkeydown(key) {
        for (let p = 0; p < 2; p++) {
            if (this.players[p] && key in keyToAngle[p]) {
                this.players[p].angle = keyToAngle[p][key];
                this.players[p].vel = this.players[p].velocity;
                this.keyMask[p] |= 1 << keyToAngle[p][key];
            }
            if (this.players[p] && key === keyShoot[p]) {
                this.players[p].shoot = !this.shootKeyPress[p];
                this.shootKeyPress[p] = true;
            }
        }

        if (key === "P".charCodeAt(0)) this.pause();
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
    gpAxes(x, y) {
        if (!this.players[0] || !this.axes) return;

        const key = [y < -0.5, x > 0.5, y > 0.5, x < -0.5];
        for (let a = 0; a < 4; a++) {
            if (this.axes[a] !== key[a]) {
                if (key[a]) this.onkeydown(angleToKey[a]);
                else this.onkeyup(angleToKey[a]);
                this.axes[a] = key[a];
            }
        }
    }
    gpButton(pressed) {
        if (!this.players[0] || !this.shootKeyPress) return;

        if (pressed) {
            this.players[0].shoot = !this.shootKeyPress[0];
            this.shootKeyPress[0] = true;
        } else {
            this.shootKeyPress[0] = false;
        }
    }
}
