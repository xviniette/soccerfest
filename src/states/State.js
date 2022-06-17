export default class {
    constructor(json) {
        this.stateManager
        this._name

        this._keys = {}

        this.callbacks = {
            keys: [],
            keydown: [],
        }

        Object.assign(this, json)
    }

    onStart() {}

    update() {}

    onEnd() {}

    isActive() {
        return this.stateManager.currents.some(state => state.name == this._name)
    }

    setState(name, params = {}) {
        this.stateManager.setState(name, params)
    }

    isDown(k) {
        return this._keys[k]
    }

    onKeyDown(k, cb = () => {}) {
        if (!this.callbacks.keys[k]) this.callbacks.keys[k] = []
        this.callbacks.keys[k].push(cb)
    }

    onDown(cb = e => {}) {
        this.callbacks.keydown.push(cb)
    }

    keydown(e) {
        this.callbacks.keydown.forEach(cb => cb(e))
        this.callbacks.keys[e.code]?.forEach(cb => cb(e))

        this._keys[e.code] = true
    }

    keyup(e) {
        this._keys[e.code] = false
    }
}
