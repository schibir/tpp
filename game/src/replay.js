
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
        this.total_scores = tanks.total_scores;
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
    }
    save() {
        console.log(`Save replay with seed = ${this.random_seed}`);
    }
}
