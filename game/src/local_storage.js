
export default class LocalStorage {
    static localStorageSupported() {
        try {
            const testKey = "test";
            const storage = window.localStorage;
            storage.setItem(testKey, "1");
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Best score getters/setters
    static getBestScore(id) {
        const supported = LocalStorage.localStorageSupported();
        if (!supported) return 0;
        return window.localStorage.getItem(id) || 0;
    }

    static setBestScore(id, score) {
        const supported = LocalStorage.localStorageSupported();
        if (!supported) return 0;
        const current = parseInt(this.getBestScore(id), 10);
        if (!current || score > current) {
            window.localStorage.setItem(id, score);
            return score;
        }
        return current;
    }
}
