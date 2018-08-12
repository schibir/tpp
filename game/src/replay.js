
import { Random } from "./utils";
import { ITEM, TANK } from "./global";

class RawBuffer {
    constructor() {
        this.currentOffset = 0;
        this.currentByte = 0;
        this.data = [];
    }
    saveByte() {
        console.assert(this.currentByte >= 0 && this.currentByte < 256);
        this.data.push(this.currentByte);
        this.currentByte = 0;
    }
    done() {
        if (this.currentOffset & 7) this.saveByte();
        this.currentOffset = 0;
    }
    addUint16(val) {
        this.addBits(2 * 8, val);
    }
    addUint32(val) {
        this.addBits(4 * 8, val);
    }
    addBool(val) {
        this.addBits(1, val ? 1 : 0);
    }
    getUint16() {
        return this.getBits(2 * 8);
    }
    getUint32() {
        return this.getBits(4 * 8);
    }
    getBool() {
        return !!this.getBits(1);
    }
    addBits(bits, val) {
        console.assert(bits === 32 || (val < 1 << bits));
        const offsetInCurrentByte = this.currentOffset & 7;
        const padding = 8 - offsetInCurrentByte;
        this.currentByte |= ((val & 0xff) << offsetInCurrentByte) & 0xff;
        if (padding <= bits) this.saveByte();
        if (padding < bits) {
            this.currentOffset += padding;
            this.addBits(bits - padding, val >> padding);
            return;
        }
        this.currentOffset += bits;
    }
    getBits(bits) {
        const offsetInCurrentByte = this.currentOffset & 7;
        const padding = 8 - offsetInCurrentByte;
        const currentIndex = this.currentOffset >> 3;
        if (currentIndex >= this.data.length) return 0;
        const val = this.data[currentIndex] >> offsetInCurrentByte;
        if (padding >= bits) {
            this.currentOffset += bits;
            return val & ((1 << bits) - 1);
        }
        this.currentOffset += padding;
        return val | (this.getBits(bits - padding) << padding);
    }
    eof() {
        return (this.currentOffset >> 3) >= this.data.length;
    }
    toBase64() {
        const base64 = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890[]";
        console.assert(base64.length === 64);
        this.done();

        let res = "";
        while (!this.eof()) {
            const elem = this.getBits(6);
            res += base64[elem];
        }
        return res;
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
        const buffer = new RawBuffer();
        buffer.addUint32(this.random_seed);
        buffer.addBits(3, this.level);         // 0 - 5
        buffer.addBits(4, this.difficulty);    // 0 - 15
        buffer.addBits(4, this.life);          // 0 - inf, but 15 impossible
        buffer.addBits(9, this.scores);        // max scores for levelup = 400
        buffer.addUint16(this.total_scores);
        buffer.addBool(this.items[ITEM.FIREBALL]);
        buffer.addBool(this.items[ITEM.SPEED]);
        buffer.addBool(this.items[ITEM.STAR]);
        buffer.addBool(this.players[TANK.TANK1]);
        buffer.addBool(this.players[TANK.TANK2]);
        if (this.players[TANK.TANK1]) {
            buffer.addBits(3, this.players[TANK.TANK1].weaponType);    // 0 - 7
            buffer.addBits(3, this.players[TANK.TANK1].life);          // 1 - 6
            buffer.addBool(this.players[TANK.TANK1].velocity > 2);     // super speed = 2.4
        }
        if (this.players[TANK.TANK2]) {
            buffer.addBits(3, this.players[TANK.TANK2].weaponType);    // 0 - 7
            buffer.addBits(3, this.players[TANK.TANK2].life);          // 1 - 6
            buffer.addBool(this.players[TANK.TANK2].velocity > 2);     // super speed = 2.4
        }

        const base64 = buffer.toBase64();
        console.log(`Replay = ${base64}`);

        // test
        buffer.currentOffset = 0;
        console.assert(buffer.getUint32() === this.random_seed);
        console.assert(buffer.getBits(3) === this.level);
        console.assert(buffer.getBits(4) === this.difficulty);
        console.assert(buffer.getBits(4) === this.life);
        console.assert(buffer.getBits(9) === this.scores);
        console.assert(buffer.getUint16() === this.total_scores);
        console.assert(buffer.getBool() === this.items[ITEM.FIREBALL]);
        console.assert(buffer.getBool() === this.items[ITEM.SPEED]);
        console.assert(buffer.getBool() === this.items[ITEM.STAR]);
        const pl1 = buffer.getBool();
        console.assert(pl1 === !!this.players[TANK.TANK1]);
        const pl2 = buffer.getBool();
        console.assert(pl2 === !!this.players[TANK.TANK2]);
        if (pl1) {
            console.assert(buffer.getBits(3) === this.players[TANK.TANK1].weaponType);
            console.assert(buffer.getBits(3) === this.players[TANK.TANK1].life);
            console.assert(buffer.getBool() === this.players[TANK.TANK1].velocity > 2);
        }
        if (pl2) {
            console.assert(buffer.getBits(3) === this.players[TANK.TANK2].weaponType);
            console.assert(buffer.getBits(3) === this.players[TANK.TANK2].life);
            console.assert(buffer.getBool() === this.players[TANK.TANK2].velocity > 2);
        }
    }
}
