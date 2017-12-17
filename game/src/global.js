
export const TANK = {
    TANK1: 0,
    TANK2: 1,
    SIMPLE: 2,
    BMP: 3,
    CANNON: 4,
    STRONG: 5,
    PANZER: 6,
    RANDOM: 7,
};

export function tankRadius(type) {
    return type < TANK.PANZER ? 0.8 : 1;
}

export const BULLET = {
    SIMPLE: 0,
    SINGLE: 1,
    DOUBLE: 2,
    POWER: 3,
    FIRE: 4,
};

export function bulletVelocity(type) {
    return type & (BULLET.SINGLE | BULLET.DOUBLE) ? 7.2 : 2.88;
}

export const ITEM = {
    LIFE: 0,
    KNUKLE: 1,
    STAR: 2,
    SPEED: 3,
    FIREBALL: 4,
};
