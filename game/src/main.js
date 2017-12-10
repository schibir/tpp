
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

    const game = new Game(-2, canvas, "test");
}
window.addEventListener("load", main);
