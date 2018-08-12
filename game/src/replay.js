
import { Random } from "./utils";
import { ITEM, TANK } from "./global";

class MocView {
    constructor() {
        this.currentOffset = 0;
    }
    addUint16() {
        this.currentOffset += 2 * 8;
    }
    addUint32() {
        this.currentOffset += 4 * 8;
    }
    addBits(bits) {
        this.currentOffset += bits;
    }
    addBool() {
        this.currentOffset++;
    }
}

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
        const mocView = new MocView();
        mocView.addUint32(this.random_seed);
        mocView.addBits(3, this.level);         // 0 - 5
        mocView.addBits(4, this.difficulty);    // 0 - 15
        mocView.addBits(4, this.life);          // 0 - inf, but 15 impossible
        mocView.addBits(9, this.scores);        // max scores for levelup = 400
        mocView.addUint16(this.total_scores);
        mocView.addBool(this.items[ITEM.FIREBALL]);
        mocView.addBool(this.items[ITEM.SPEED]);
        mocView.addBool(this.items[ITEM.STAR]);
        mocView.addBool(this.players[TANK.TANK1]);
        mocView.addBool(this.players[TANK.TANK2]);
        if (this.players[TANK.TANK1]) {
            mocView.addBits(3, this.players[TANK.TANK1].weaponType);    // 0 - 7
            mocView.addBits(3, this.players[TANK.TANK1].life);          // 1 - 6
            mocView.addBool(this.players[TANK.TANK1].velocity > 2);     // super speed = 2.4
        }
        if (this.players[TANK.TANK2]) {
            mocView.addBits(3, this.players[TANK.TANK2].weaponType);    // 0 - 7
            mocView.addBits(3, this.players[TANK.TANK2].life);          // 1 - 6
            mocView.addBool(this.players[TANK.TANK2].velocity > 2);     // super speed = 2.4
        }

        console.log(`Size replay = ${mocView.currentOffset} bits`);
    }
}
