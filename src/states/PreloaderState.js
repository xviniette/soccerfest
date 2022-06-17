import State from "./State.js"
import Preloader from "../modules/Preloader.js"

import assets from "../data/assets.js"
import animations from "../data/animations.js"

export default class extends State {
    constructor(json) {
        super(json)

        this.preloader = new Preloader()
        this.progress = 0
    }

    onStart() {
        this.preloader.load(assets).then(assets => {
            this.game.assets = assets
            this.setState("home")
        })

        this.setAnimations()

        this.preloader.on("progress", data => (this.progress = data))
    }

    update() {
        const { ctx, canvas } = this.game

        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "#FFFFFF"
        const height = canvas.height * 0.1
        ctx.fillRect(0, canvas.height / 2 - height / 2, canvas.width * this.progress, height)
    }

    setAnimations() {
        for (let name in animations) {
            this.game.animations[name] = this.generateAnimation(animations[name].frame, animations[name].animation)
        }
    }

    generateAnimation(frame = {}, options = {}) {
        options = {
            x: 0,
            y: 0,
            width: Infinity,
            height: Infinity,
            frames: null,
            start: 0,
            end: 0,
            ...options,
        }

        frame = { x: 0, y: 0, width: 0, height: 0, ...frame }

        const getFrame = key => {
            return {
                ...frame,
                x: options.x + frame.width * (key % Math.floor(options.width / frame.width)),
                y: options.y + frame.height * Math.floor(key / Math.floor(options.width / frame.width)),
            }
        }

        if (options.frames) return options.frames.map(key => getFrame(key))
        const frames = []
        for (let i = options.start; i <= options.end; i++) {
            frames.push(getFrame(i))
        }

        return frames
    }
}
