
import { getSizeMap } from "./utils";
import Game from "./game";

// Size of map 36x20
function calcSizeForCanvas(width, height) {
    const { mapWidth, mapHeight } = getSizeMap();
    const aspect = width / height;
    const mapAspect = mapWidth / (mapHeight + 1); // +1 for UI

    if (mapAspect > aspect) {
        return { width, height: width / mapAspect };
    }
    return { width: height * mapAspect, height };
}

function getRequestAnimationFrame() {
    if (window.requestAnimationFrame) return window.requestAnimationFrame;

    const vendors = ["webkit", "moz", "ms", "o"];
    for (let i = 0; i < vendors.length; i++) {
        if (window[`${vendors[i]}RequestAnimationFrame`]) {
            return window[`${vendors[i]}RequestAnimationFrame`];
        }
    }

    // Manual fallbacks
    let lastTime = 0;
    return (callback) => {
        const currTime = Date.now();
        const timeToCall = Math.max(0, 16 - (currTime - lastTime));
        const id = setTimeout(() => callback(currTime + timeToCall), timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}

function main() {
    console.assert = (condition, message = "Assertion failed") => {
        if (!condition) {
            console.log(message);
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    };

    const canvas = document.getElementById("canvas");
    const { width, height } = calcSizeForCanvas(window.innerWidth - 40, window.innerHeight - 40);
    canvas.width = width;
    canvas.height = height;
    const requestAnimationFrame = getRequestAnimationFrame();

    const game = new Game(-2, canvas, "test");

    const update = () => {
        game.update();
        requestAnimationFrame(update);
    };
    update();
}
window.addEventListener("load", main);
