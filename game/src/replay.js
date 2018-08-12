
import { Random } from "./utils";
import { ITEM, TANK } from "./global";

class RawBuffer {
    constructor(size) {
        this.currentOffset = 0;
        if (size) {
            this.data = new ArrayBuffer(size);
            this.view = new DataView(this.data);
            this.currentByte = 0;
            this.currentByteOffset = 0;
        }
    }
    saveByte() {
        this.view.setUint8(this.currentByteOffset, this.currentByte);
        this.currentByteOffset++;
        this.currentByte = 0;
    }
    addUint16(val) {
        this.addBits(2 * 8, val);
    }
    addUint32(val) {
        this.addBits(4 * 8, val);
    }
    addBits(bits, val) {
        console.assert(bits === 32 || (val < 1 << bits));
        if (this.view) {
            const offsetInCurrentByte = this.currentOffset % 8 | 0;
            const padding = 8 - offsetInCurrentByte;
            this.currentByte |= ((val & 0xff) << offsetInCurrentByte) & 0xff;
            if (padding <= bits) this.saveByte();
            if (padding < bits) {
                this.currentOffset += padding;
                this.addBits(bits - padding, val >> padding);
                return;
            }
        }
        this.currentOffset += bits;
    }
    addBool(val) {
        this.addBits(1, val ? 1 : 0);
    }
    getSizeInBytes() {
        return (this.currentOffset + 7) / 8 | 0;
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
    save(size = 0) {
        const buffer = new RawBuffer(size);
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

        console.log(`Size replay = ${buffer.currentOffset} bits`);
        console.log(`Size replay = ${buffer.getSizeInBytes()} bytes`);

        if (size === 0) this.save(buffer.getSizeInBytes());
    }
}
