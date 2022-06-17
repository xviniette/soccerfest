import merge from "./merge.js"
export default class {
    constructor() {
        this.id = Math.floor(Math.random() * 999999999)

        this.cx = 0
        this.cy = 0
        this.rx = 0
        this.ry = 0

        this.dx = 0
        this.dy = 0
        this.radius = 0
        this.onGround = false
        this.gravity = { x: 0, y: 0 }
        this.friction = { x: 0, y: 0 }
        this.bounce = { x: 0, y: 0 }

        this.game
    }

    init(json) {
        merge(this, json)
    }

    static getType() {
        return "entity"
    }

    get type() {
        return this.constructor.getType()
    }

    set type(value) {}
    set typeId(value) {}

    get x() {
        return this.cx + this.rx
    }

    get y() {
        return this.cy + this.ry
    }

    set x(x) {
        this.cx = Math.floor(x)
        this.rx = x - this.cx
    }

    set y(y) {
        this.cy = Math.floor(y)
        this.ry = y - this.cy
    }

    hasCollision(entity) {
        return this.distance(entity) <= this.radius + entity.radius
    }

    distance(entity) {
        return Math.sqrt((entity.x - this.x) ** 2 + (entity.y - this.y) ** 2)
    }

    update() {
        const map = this.game.map
        const gap = 0.3

        this.dy += this.gravity.y
        this.ry += this.dy
        this.dy *= this.friction.y

        this.onGround = false

        if (!map.isBlock(this.cx, this.cy) && this.dy > 0 && this.cy > 0) {
            if (
                (map.isBlock(this.cx, this.cy + 1) ||
                    (map.isBlock(this.cx + 1, this.cy + 1) && this.rx > 1 - this.radius * gap && !map.isBlock(this.cx + 1, this.cy)) ||
                    (map.isBlock(this.cx - 1, this.cy + 1) && this.rx < this.radius * gap && !map.isBlock(this.cx - 1, this.cy))) &&
                this.ry >= 1 - this.radius
            ) {
                this.dy *= -this.bounce.y
                this.ry = 1 - this.radius
                this.onGround = true
            }
        }

        while (this.ry < 0) {
            this.ry++
            this.cy--
        }

        while (this.ry > 1) {
            this.ry--
            this.cy++
        }

        this.dx += this.gravity.x
        this.rx += this.dx
        this.dx *= this.friction.x

        if (
            !map.isBlock(this.cx, this.cy) ||
            this.cx <= 0 ||
            this.cx >= map.tiles.length - 1 ||
            this.cy < 0 ||
            this.cy > map.tiles[this.cx].length - 1
        ) {
            if (map.isBlock(this.cx - 1, this.cy) && this.rx <= this.radius && this.dx < 0) {
                this.rx = this.radius
                this.dx *= -this.bounce.x
            }

            if (map.isBlock(this.cx + 1, this.cy) && this.rx >= 1 - this.radius && this.dx > 0) {
                this.rx = 1 - this.radius
                this.dx *= -this.bounce.x
            }
        }

        if (map.isBlock(this.cx, this.cy)) {
            this.dx *= this.bounce.x
        }

        while (this.rx < 0) {
            this.rx++
            this.cx--
        }
        while (this.rx > 1) {
            this.rx--
            this.cx++
        }

        let warp
        warp = map.isWarp(this.cx, this.cy)
        if (warp && warp.h && Math.abs(this.dx) > 0) {
            this.cx = warp.x + Math.sign(this.dx)
            this.cy = warp.y
            if (this.type != "particle") this.game.addEvent("warp")
        }

        warp = map.isWarp(this.cx, this.cy)
        if (warp && warp.v && Math.abs(this.dy) > 0) {
            this.cx = warp.x
            this.cy = warp.y + Math.sign(this.dy)
            if (this.type != "particle") this.game.addEvent("warp")
        }
    }

    getStateAttributes() {
        return ["type", "id", "x", "y", "dx", "dy", "radius", "gravity", "friction", "bounce"]
    }

    getState() {
        const data = {}

        this.getStateAttributes().forEach(attribute => (data[attribute] = this[attribute]))

        return data
    }

    setState(data) {
        this.init(data)
    }

    getChecksum() {
        return this.x + this.y + this.radius
    }
}
