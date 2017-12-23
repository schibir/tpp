
export default class Event {
    constructor() {
        this.events = [];
    }
    on(eventName, callback) {
        if (!(eventName in this.events)) {
            this.events[eventName] = [];
        }
        this.events[eventName].push({ callback });
        console.assert(this.events[eventName].length < 10, "too many listeners");
    }
    emit(eventName, ...param) {
        const event = this.events[eventName];
        if (event && event.length > 0) {
            event.forEach((listeners) => listeners.callback(...param));
        }
    }
}
