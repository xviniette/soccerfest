export default class {
    constructor() {
        this.states = []

        this.currents = []

        window.addEventListener("keydown", e => this.currents.forEach(state => state.state.keydown(e)))
        window.addEventListener("keyup", e => this.currents.forEach(state => state.state.keyup(e)))
    }

    stopState(name) {
        const state = this.currents.find(s => s.name === name)
        if (!state) return this

        state.state.onEnd()
        this.currents.filter(s => s.name !== name)
    }

    startState(name, parameters = {}) {
        const state = this.states.find(s => s.name == name)
        if (!state) return this

        this.currents.push(state)
        state.state.onStart(parameters)
        return this
    }

    setState(name, parameters = {}) {
        this.currents.forEach(state => state.state.onEnd())

        this.currents = []

        this.startState(name, parameters)
        return this
    }

    addState(name, state) {
        state.stateManager = this
        state._name = name
        this.states.push({ name, state })
        return this
    }

    removeState(state) {
        this.states = this.states.filter(sc => sc != state)
        return this
    }

    update() {
        if (!this._lastUpdate) this._lastUpdate = Date.now()
        const dt = (Date.now() - this._lastUpdate) / 1000

        this.currents.forEach(state => state.state.update(dt))

        this._lastUpdate = Date.now()

        return this
    }
}
