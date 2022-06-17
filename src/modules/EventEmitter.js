export default class {
    constructor() {
        this._events = {}
    }

    on(name, listener) {
        if (!this._events[name]) this._events[name] = []
        this._events[name].push(listener)
    }

    emit(name, data) {
        if (!this._events[name]) return
        this._events[name].forEach((event) => event(data))
    }

    removeEvent(name) {
        delete this._events[name]
    }

    removeListener(name, listener) {
        if (!this._events[name]) return
        this._events = this._events.filter((e) => e != listener)
    }
}
