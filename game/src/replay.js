
import { Random } from "./utils";
import { ITEM, TANK } from "./global";
import LocalStorage from "./local_storage";

class RawBuffer {
    constructor() {
        this.currentOffset = 0;
        this.currentByte = 0;
        this.data = [];
        this.base64 = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890*-";
    }
    saveByte() {
        console.assert(this.currentByte >= 0 && this.currentByte < 256);
        this.data.push(this.currentByte);
        this.currentByte = 0;
    }
    reset() {
        this.currentOffset = 0;
    }
    done() {
        if (this.currentOffset & 7) this.saveByte();
        const tail = this.data.length % 3 | 0;
        if (tail > 0) this.addBits(8, 0);
        if (tail === 1) this.addBits(8, 0);
        this.reset();
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
        let res = "";
        while (!this.eof()) {
            const elem = this.getBits(6);
            res += this.base64[elem];
        }
        this.reset();
        return res;
    }
    fromBase64(str) {
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const index = this.base64.indexOf(char);
            this.addBits(6, index);
        }
        this.done();

        const base64 = this.toBase64();
        console.assert(str === base64);
    }
}

class PlayerStateElem {
    constructor(frame, value) {
        this.frame = frame;
        this.value = value;
    }
}

class PlayerState {
    constructor() {
        this.angles = [];
        this.moves = [];
        this.shootes = [];
    }
    checkPlayer(player, frame) {
        const angle = this.angles.length === 0 ? 0 : this.angles[this.angles.length - 1].value;
        const move = this.moves.length === 0 ? false : this.moves[this.moves.length - 1].value;

        if (angle !== player.angle) this.angles.push(new PlayerStateElem(frame, player.angle));
        if (move !== player.vel > 0.5) this.moves.push(new PlayerStateElem(frame, player.vel > 0.5));
        if (player.shoot) this.shootes.push(new PlayerStateElem(frame, player.shoot));
    }
    toBuffer(buffer) {
        const saveArray = (array) => {
            buffer.addUint16(array.length);
            console.log(`Array length = ${array.length}`);
            if (array.length === 0) return;
            const lastFrame = array[array.length - 1].frame;
            let avgDelta = lastFrame / array.length | 0;
            let log2 = 0;
            while (avgDelta) {
                avgDelta >>= 1;
                log2++;
            }

            const saveToBuffer = (buf, log) => {
                buf.addBits(4, log);
                const ffff = (1 << log) - 1;
                let last = 0;
                array.forEach((elem) => {
                    let delta = elem.frame - last;
                    last = elem.frame;
                    if (delta < ffff) {
                        buf.addBits(log, delta);
                        return;
                    }
                    buf.addBits(log, ffff);
                    if (delta === ffff) {
                        buf.addBits(8, 0xff);
                    } else {
                        let count = delta / ffff | 0;
                        buf.addBits(8, count);
                        buf.addBits(log, delta % ffff | 0);
                    }
                });
            };

            let minSize = buffer.length * 2; // because uint16_t
            let minLog = log2;
            for (let i = Math.min(8, log2 - 1); i <= log2 + 2; i++) {
                const testBuf = new RawBuffer();
                saveToBuffer(testBuf, i);
                testBuf.done();
                console.log(`For log = ${i}, size = ${testBuf.data.length}`);
                if (testBuf.data.length < minSize) {
                    minSize = testBuf.data.length;
                    minLog = i;
                }
            }

            saveToBuffer(buffer, minLog);
        };

        saveArray(this.angles);
        saveArray(this.moves);
        saveArray(this.shootes);

        this.angles.forEach((elem) => buffer.addBits(2, elem.value));
    }
    fromBuffer(buffer) {
        const loadArray = (array) => {
            const length = buffer.getUint16();
            if (length === 0) return;

            const log = buffer.getBits(4);
            const ffff = (1 << log) - 1;
            let last = 0;
            for (let i = 0; i < length; i++) {
                let elem = new PlayerStateElem(0, 0);
                let delta = buffer.getBits(log);
                if (delta === ffff) {
                    delta = buffer.getBits(8);
                    if (delta === 0xff) delta = ffff;
                    else {
                        const count = delta;
                        delta = count * ffff + buffer.getBits(log);
                    }
                }
                elem.frame = last + delta;
                last = elem.frame;
                array.push(elem);
            }
        };

        loadArray(this.angles);
        loadArray(this.moves);
        loadArray(this.shootes);

        this.angles.forEach((elem) => {
            elem.value = buffer.getBits(2)
        });
    }
}

export default class Replay {
    constructor(level, tanks = null) {
        this.players = {};
        this.frameNumber = 0;
        this.playersState = {
            [TANK.TANK1]: new PlayerState(),
            [TANK.TANK2]: new PlayerState(),
        };

        if (!tanks) return;
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
        tanks.objects.forEach((tank) => {
            if (tank.type <= TANK.TANK2) {
                this.players[tank.type] = {
                    weaponType: tank.weapon.type,
                    life: tank.life,
                    maxVelocity: tank.velocity > 2,
                };
            }
        });
    }
    processPlayers(players) {
        players.forEach((pl) => {
            if (!pl) return;
            this.playersState[pl.type].checkPlayer(pl, this.frameNumber);
        });
        this.frameNumber++;
    }
    save() {
        const buffer = new RawBuffer();
        buffer.addUint32(this.random_seed);
        buffer.addBits(3, this.level);         // 0 - 5
        buffer.addBits(4, this.difficulty);    // 0 - 15
        buffer.addBits(4, this.life);          // 0 - inf, but 15 impossible
        buffer.addBits(9, this.scores);        // max scores for levelup = 400
        buffer.addUint16(this.total_scores);
        buffer.addUint16(this.frameNumber);
        buffer.addBool(this.items[ITEM.FIREBALL]);
        buffer.addBool(this.items[ITEM.SPEED]);
        buffer.addBool(this.items[ITEM.STAR]);
        buffer.addBool(this.players[TANK.TANK1]);
        buffer.addBool(this.players[TANK.TANK2]);
        if (this.players[TANK.TANK1]) {
            buffer.addBits(3, this.players[TANK.TANK1].weaponType);    // 0 - 7
            buffer.addBits(3, this.players[TANK.TANK1].life);          // 1 - 6
            buffer.addBool(this.players[TANK.TANK1].maxVelocity);
            this.playersState[TANK.TANK1].toBuffer(buffer);
        }
        if (this.players[TANK.TANK2]) {
            buffer.addBits(3, this.players[TANK.TANK2].weaponType);    // 0 - 7
            buffer.addBits(3, this.players[TANK.TANK2].life);          // 1 - 6
            buffer.addBool(this.players[TANK.TANK2].maxVelocity);
            this.playersState[TANK.TANK2].toBuffer(buffer);
        }

        buffer.done();

        const base64 = buffer.toBase64();
        const key = "replay1";
        LocalStorage.saveReplay(key, base64);
        console.log(`Replay = ${base64}`);
        console.log(`Replay size = ${base64.length}`);

        // test
        const loadReplay = LocalStorage.loadReplay(key);
        let load = new Replay();
        load.load(loadReplay);
        console.assert(load.random_seed === this.random_seed);
        console.assert(load.level === this.level);
        console.assert(load.difficulty === this.difficulty);
        console.assert(load.life === this.life);
        console.assert(load.scores === this.scores);
        console.assert(load.total_scores === this.total_scores);
        console.assert(load.frameNumber === this.frameNumber);
        console.assert(load.items[ITEM.FIREBALL] === this.items[ITEM.FIREBALL]);
        console.assert(load.items[ITEM.SPEED] === this.items[ITEM.SPEED]);
        console.assert(load.items[ITEM.STAR] === this.items[ITEM.STAR]);
        console.assert(!!load.players[TANK.TANK1] === !!this.players[TANK.TANK1]);
        console.assert(!!load.players[TANK.TANK2] === !!this.players[TANK.TANK2]);
        if (load.players[TANK.TANK1]) {
            console.assert(load.players[TANK.TANK1].weaponType === this.players[TANK.TANK1].weaponType);
            console.assert(load.players[TANK.TANK1].life === this.players[TANK.TANK1].life);
            console.assert(load.players[TANK.TANK1].maxVelocity === this.players[TANK.TANK1].maxVelocity);
            console.assert(load.playersState[TANK.TANK1].angles.length === this.playersState[TANK.TANK1].angles.length);
            console.assert(load.playersState[TANK.TANK1].moves.length === this.playersState[TANK.TANK1].moves.length);
            console.assert(load.playersState[TANK.TANK1].shootes.length === this.playersState[TANK.TANK1].shootes.length);
        }
        if (load.players[TANK.TANK2]) {
            console.assert(load.players[TANK.TANK2].weaponType === this.players[TANK.TANK2].weaponType);
            console.assert(load.players[TANK.TANK2].life === this.players[TANK.TANK2].life);
            console.assert(load.players[TANK.TANK2].maxVelocity === this.players[TANK.TANK2].maxVelocity);
        }
    }
    load(base64) {
        const load = new RawBuffer();
        load.fromBase64(base64);
        this.random_seed = load.getUint32();
        this.level = load.getBits(3);
        this.difficulty = load.getBits(4);
        this.life = load.getBits(4);
        this.scores = load.getBits(9);
        this.total_scores = load.getUint16();
        this.frameNumber = load.getUint16();
        this.items = {
            [ITEM.FIREBALL]: load.getBool(),
            [ITEM.SPEED]: load.getBool(),
            [ITEM.STAR]: load.getBool(),
        };
        const pl1 = load.getBool();
        const pl2 = load.getBool();
        if (pl1) {
            this.players[TANK.TANK1] = {
                weaponType: load.getBits(3),
                life: load.getBits(3),
                maxVelocity: load.getBool(),
            };
            this.playersState[TANK.TANK1].fromBuffer(load);
        }
        if (pl2) {
            this.players[TANK.TANK2] = {
                weaponType: load.getBits(3),
                life: load.getBits(3),
                maxVelocity: load.getBool(),
            };
            this.playersState[TANK.TANK2].fromBuffer(load);
        }
    }
}
