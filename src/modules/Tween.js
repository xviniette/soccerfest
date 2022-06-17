export default class {
    constructor(json) {
        this.time = 0
        this.startTime
        this.loop = 0
        this.yoyo = false
        this.easing = "linear"
        this.data = {}

        Object.assign(this, json)
    }

    start() {
        this.startTime = Date.now()
        return this
    }

    getRatio() {
        const now = Date.now()

        if (!this.startTime) return 0

        const currentDuration = now - this.startTime
        const loop = Math.floor(currentDuration / this.time)

        if (this.loop > -1 && loop > this.loop) return 1

        let timeRatio = (currentDuration / this.time) % 1

        if (loop % 2 == 1 && this.yoyo) timeRatio = 1 - timeRatio

        return this.easingFunctions[this.easing](timeRatio)
    }

    getValue() {
        const ratio = this.getRatio()

        const d = {}

        for (let attr in this.data) {
            const { from, to } = this.data[attr]
            d[attr] = (to - from) * ratio + from
        }

        return d
    }

    get easingFunctions() {
        return {
            linear: (t) => t,
            InQuad: (t) => t * t,
            OutQuad: (t) => t * (2 - t),
            InOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
            InCubic: (t) => t * t * t,
            OutCubic: (t) => --t * t * t + 1,
            InOutCubic: (t) =>
                t < 0.5
                    ? 4 * t * t * t
                    : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            InQuart: (t) => t * t * t * t,
            OutQuart: (t) => 1 - --t * t * t * t,
            InOutQuart: (t) =>
                t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
            InQuint: (t) => t * t * t * t * t,
            OutQuint: (t) => 1 + --t * t * t * t * t,
            InOutQuint: (t) =>
                t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
            sinOut(t) {
                return t
            },
        }
    }
}
