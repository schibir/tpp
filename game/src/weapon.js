
import { Bullet } from "./bullet";
import { bulletsCount } from "./global";

export default class Weapon {
    constructor(owner, type) {
        this.owner = owner;
        this.setType(type);
    }
    setType(type) {
        this.type = type;
        this.count = bulletsCount(type);
    }
    shoot() {
        if (this.count) {
            this.count--;
            return new Bullet(this.owner, this.type, () => this.count++);
        }
        return null;
    }
}
