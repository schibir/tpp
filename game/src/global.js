
import { rand, getProbability } from "./utils";

export const TANK = {
    TANK1: 0,
    TANK2: 1,
    SIMPLE: 2,
    BMP: 3,
    CANNON: 4,
    STRONG: 5,
    PANZER: 6,
    RANDOM: 7,
    EAGLE: 8,
};

export const STATE = {
    DEAD: 0,
    RESPAWN: 1,
    GOD: 2,
    NORMAL: 3,
};

export function tankRadius(type) {
    return type < TANK.PANZER ? 0.8 : 1;
}

export function tankLife(type) {
    console.assert(type >= TANK.TANK1 && type <= TANK.EAGLE, "Wrong tank type");
    const lifeTable = [1, 1, 1, 1, 1, 4, 6, 0, 1];
    return lifeTable[type];
}

export function botTypeProbability(difficulty) {
    const botTypeProbabilities = [
        [0, 0, 10, 6, 6, 3, 1],         // Private
        [0, 0, 5, 5, 5, 3, 2],          // Sergeant
        [0, 0, 2, 4, 4, 4, 3],          // Lieutenant
        [0, 0, 1, 3, 3, 4, 4],          // General
    ];
    const ind = difficulty / 4 | 0;
    console.assert(ind >= 0 && ind < 4, "Wrong difficulty value");
    return getProbability(botTypeProbabilities[ind]);
}

export function angleProbability() {
    return getProbability([1, 3, 5, 3]);
}

export function shootTime(difficulty) {
    const shootTable = [
        2000, 1700, 1300, 1000,
        800, 750, 700, 650,
        600, 500, 450, 400,
        350, 300, 250, 200,
    ];
    console.assert(difficulty >= 0 && difficulty < 16, "Wrong difficulty value");
    return shootTable[difficulty];
}

export function tankVelocity(type) {
    console.assert(type >= TANK.TANK1 && type <= TANK.EAGLE, "Wrong tank type");
    return [1.5, 1.5, 1.2, 2.4, 1.2, 1, 0.75, 0, 0][type];
}

export function directionTime(collision) {
    return collision ? rand(250, 150) : rand(3000, 1000);
}

export const BULLET = {
    SIMPLE: 0,
    SINGLE: 1,
    DOUBLE: 2,
    POWER: 3,
    FIRE: 4,
};

export function tankWeaponType(type) {
    const weaTable = [
        BULLET.SIMPLE, BULLET.SIMPLE,
        BULLET.SIMPLE, BULLET.SIMPLE, BULLET.SINGLE,
        BULLET.SIMPLE, BULLET.POWER | BULLET.FIRE,
        BULLET.SIMPLE, BULLET.SIMPLE,
    ];
    console.assert(type >= TANK.TANK1 && type <= TANK.EAGLE, "Wrong tank type");
    return weaTable[type];
}

export function bulletVelocity(type) {
    return type & (BULLET.SINGLE | BULLET.DOUBLE) ? 7.2 : 2.88;
}

export function bulletDamage(type) {
    return (type & BULLET.POWER) === BULLET.POWER ? 2 : 1;
}

export function bulletsCount(type) {
    return type & BULLET.DOUBLE ? 2 : 1;
}

export const ITEM = {
    LIFE: 0,
    KNUKLE: 1,
    ZOMBIE: 2,
    STAR: 3,
    SPEED: 4,
    FIREBALL: 5,
};

export function getItem() {
    const probs = [1, 2, 2, 2, 2, 2];
    const ind = getProbability(probs);
    return ind;
}

export function itemRespawnTime(difficulty) {
    const timeTable = [
        15000, 13000, 12000, 11000,
        10000, 8000, 7000, 6000,
        5000, 3000, 2000, 1000,
        1, 1, 1, 1,
    ];
    console.assert(difficulty >= 0 && difficulty < 16, "Wrong difficulty value");
    return Math.random() * timeTable[difficulty] + 10000;
}

const SMOKE0 = 32;
const SMOKE1 = 64;
const SMOKE2 = 128;
const SMOKE3 = 256;

export const PART = {
    SPARK: 1,
    FIRE: 2,
    BRICK: 4,
    BETON: 8,
    EXPLODE: 16,
    SMOKE0,
    SMOKE1,
    SMOKE2,
    SMOKE3,
    SMOKE: SMOKE0 | SMOKE1 | SMOKE2 | SMOKE3,
};

export function timeToRespawn(difficulty) {
    const respTable = [
        1000, 950, 900, 850,
        800, 750, 700, 650,
        600, 575, 550, 525,
        500, 400, 300, 200,
    ];
    console.assert(difficulty >= 0 && difficulty < 16, "Wrong difficulty value");
    return respTable[difficulty] + Math.random() * (3000 - difficulty * 133);
}

export function getScores(type) {
    console.assert(type >= TANK.TANK1 && type <= TANK.EAGLE, "Wrong tank type");
    return [0, 0, 1, 3, 2, 5, 8, 0, 0][type];
}

export function scoreToLevelup(difficulty) {
    console.assert(difficulty >= 0 && difficulty < 16, "Wrong difficulty value");
    return 25 * (difficulty + 1);
}

export const LEVEL_TIME = 80000;
