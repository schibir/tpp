
import { Random } from "./utils";
import { ITEM, TANK } from "./global";

export default class Replay {
    constructor(level, tanks) {
        this.random_seed = Random.getSeed();
        this.level = level;

        // TankManager
        this.difficulty = tanks.difficulty;
        this.life = tanks.life;
        this.scores = tanks.scores;
        this.items = {
            [ITEM.FIREBALL]: tanks.items[ITEM.FIREBALL],
            [ITEM.SPEED]: tanks.items[ITEM.SPEED],
            [ITEM.STAR]: tanks.items[ITEM.STAR],
        };

        // Players
        this.players = {};
        tanks.objects.forEach((tank) => {
            if (tank.type <= TANK.TANK2) {
                this.players[tank.type] = {
                    weaponType: tank.weapon.type,
                    life: tank.life,
                    velocity: tank.velocity,
                };
            }
        });

        this.last_time = -1;
        this.frame_times = [];
    }
    addFrameTime(time) {
        if (this.last_time === time) return; // detected pause

        this.last_time = time;
        this.frame_times.push(time);
    }
    save() {
        console.log(`Replay size = ${this.frame_times.length * 2} B`);
    }
}
