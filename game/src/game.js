
import { getMapSize, getTileSize } from "./utils";
import { Level, Layer } from "./level";
import { Entity } from "./entity";
import TankManager from "./tank";
import { BulletManager } from "./bullet";
import ParticleManager from "./particle";
import { TANK } from "./global";
import Event from "./event";

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

class Menu {
    constructor(text, width, height) {
        const { mapWidth, mapHeight } = getMapSize();
        const size = getTileSize(width, height);
        this.entity = new Entity((mapWidth - 1) / 2, (mapHeight - 1) / 2, 12);
        this.layer = new Layer(this.entity.size * size, this.entity.size * size);

        const ctx = this.layer.context;
        ctx.fillStyle = "red";
        ctx.fillRect(0, 4 * size, this.layer.canvas.width, this.layer.canvas.height - 8 * size);
    }
}

export default class Game {
    constructor(canvas, params) {
        // common game settings
        const currentDifficulty = parseInt(params.difficulty, 10);
        this.currentLevel = 1;
        this.canvas = canvas;
        this.mode = params.mode;

        const { mapWidth, mapHeight } = getMapSize();
        this.mapWidth = mapWidth - 2;       // board
        this.mapHeight = mapHeight - 2;     // board

        this.event = new Event();
        this.particles = new ParticleManager(this.event);
        this.tanks = new TankManager(currentDifficulty, this.event);
        this.bullets = new BulletManager(this.event);

        this.pauseMenu = new Menu("Pause", canvas.width, canvas.height);

        this.eagle = new Entity(this.mapWidth * 0.5, this.mapHeight - 1);
        const tank1 = this.tanks.create(TANK.TANK1);
        const tank2 = params.twoplayers === "true" ? this.tanks.create(TANK.TANK2) : null;
        this.players = [tank1, tank2];

        this.event.on("levelCreated", () => {
            this.particles.reset();
            this.tanks.reset(Date.now());
            this.bullets.reset();
            this.pauseTime = 0;
            this.startPauseTime = 0;

            // player settings
            this.keyMask = [0, 0];
            this.shootKeyPress = [false, false];
        });
        this.event.on("playerCreated", (tank) => {
            this.players[tank.type] = tank;
        });

        this.newLevel();
    }
    newLevel() {
        let levelName = `levels/${this.mode}`;
        if (this.mode === "level") levelName += `${this.currentLevel}`;

        this.level = new Level(levelName, this.canvas, this.event);
    }
    update() {
        if (!this.level.ready()) return;

        const timeOffset = this.startPauseTime ? Date.now() - this.startPauseTime : 0;
        const currentTime = Date.now() - this.pauseTime - timeOffset;

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
        this.particles.draw(this.level, 0);
        this.tanks.draw(this.level);
        this.bullets.draw(this.level);
        this.particles.draw(this.level, 1);

        // draw menu
        // this.level.drawEntityBegin(this.pauseMenu.entity, this.pauseMenu.layer.canvas);
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

        if (key === "N".charCodeAt(0)) this.newLevel();
        if (key === "P".charCodeAt(0)) {
            if (this.startPauseTime) {
                this.pauseTime += Date.now() - this.startPauseTime;
                this.startPauseTime = 0;
            } else this.startPauseTime = Date.now();
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
