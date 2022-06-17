import Entity from "../Entity.js"

export default class extends Entity {
    constructor(json) {
        super()

        this.maxspeed
        this.kick = { x: 0, y: 0 }
        this.up = { x: 0, y: 0, boost: 0 }
        this.respawnTime

        this.init(json)
    }

    static getType() {
        return "ball"
    }

    kicked(player) {
        this.dx = this.kick.x * player.direction
        this.dy = this.kick.y
    }

    uped(player) {
        this.dy = this.up.y
        this.dx = this.dx * this.up.boost + this.up.x * player.direction
    }

    update() {
        const goal = this.game.map.isGoal(this.cx, this.cy)
        if (goal !== false) {
            this.game.goal(goal == 1 ? 2 : 1)

            this.game.deleteEntity(this.id)

            for (let i = 0; i < 10; i++) {
                this.game.addEntity("particle", {
                    x: this.x,
                    y: this.y,
                    radius: 0.1,
                    dx: (Math.random() - 0.5) * 1.5,
                    dy: (Math.random() - 0.5) * 1.5,
                    gravity: {
                        x: 0,
                        y: 0.013,
                    },
                    friction: {
                        x: 0.97,
                        y: 0.97,
                    },
                    bounce: {
                        x: 0.95,
                        y: 0.95,
                    },
                    life: Math.floor(Math.random() * 100 + 100),
                    color: goal == 1 ? "#ff0000" : "#0000ff",
                })
            }

            if (this.game.getEntities("ball").length == 0) this.game.spawnBallIn(this.respawnTime)
            return
        }

        if (this.cy > this.game.map.tiles[0].length) {
            this.game.deleteEntity(this.id)
            if (this.game.getEntities("ball").length == 0) this.game.spawnBallIn(this.respawnTime)
            return
        }

        if (Math.abs(this.dx) > this.maxspeed) this.dx = this.maxspeed * Math.sign(this.dx)

        super.update()
    }
}
