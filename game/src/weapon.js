
import { Bullet } from "./bullet";
import { bulletsCount, BULLET } from "./global";

export default class Weapon {
    constructor(owner, type) {
        this.owner = owner;
        this.setType(type);
    }
    reset() {
        this.count = bulletsCount(this.type);
    }
    setType(type) {
        this.type = type;
        this.count = bulletsCount(type);
    }
    setFire() {
        this.type |= BULLET.FIRE;
    }
    changeType(type) {
        const old = bulletsCount(this.type);
        this.type &= ~BULLET.POWER;
        this.type |= type;
        const current = bulletsCount(this.type);
        this.count += current - old;
    }
    inc() {
        const next = Math.min((this.type & BULLET.POWER) + 1, BULLET.POWER);
        this.changeType(next);
    }
    dec() {
        const prev = Math.max((this.type & BULLET.POWER) - 1, BULLET.SIMPLE);
        this.changeType(prev);
    }
    shoot() {
        if (this.count) {
            this.count--;
            return new Bullet(this.owner, this.type, () => this.count++);
        }
        return null;
    }
}
