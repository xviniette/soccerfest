import Entity from "../Entity.js"

export default class extends Entity {
    constructor(json) {
        super()

        this.player
        this.state = 0

        this.maxspeed
        this.kick = { x: 0, y: 0 }
        this.bigKick = { x: 0, y: 0 }
        this.up = { x: 0, y: 0, boost: 0 }
        this.jumpCreation = { x: 0, y: 0 }
        this.explosionTime
        this.bigExplosionTime
        this.explosionRadius
        this.bigExplosionRadius
        this.explosionBall = { min: 0, max: 0 }
        this.explosionPlayer = { min: 0, max: 0 }
        this.timestun = { min: 0, max: 0 }

        this.init(json)
    }

    static getType() {
        return "bomb"
    }

    kicked(player) {
        if (this.state == 0 && this.player != player.id) {
            this.dx = this.bigKick.x * player.direction
            this.dy = this.bigKick.y
            this.explosionTime = this.bigExplosionTime
            this.state = 1
            return
        }

        this.dx = this.kick.x * player.direction
        this.dy = this.kick.y
        this.game.addEvent("kick")
    }

    uped(player) {
        if (this.state == 0 && this.player != player.id) {
            this.explosionTime = this.bigExplosionTime
            this.state = 1
        }

        this.dy = this.up.y
        this.dx = this.dx * this.up.boost + this.up.x * player.direction
        this.game.addEvent("up")
    }

    explode() {
        const explostionRad = this.state == 0 ? this.explosionRadius : this.bigExplosionRadius

        this.game.getEntities("player").forEach(player => {
            const distance = super.distance(player)
            if (distance <= explostionRad) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x)
                const ratio = 1 - distance / explostionRad
                const timeStun = Math.floor(ratio * (this.timestun.max - this.timestun.min) + this.timestun.min)
                const power = ratio * (this.explosionPlayer.max - this.explosionPlayer.min) + this.explosionPlayer.min
                player.stun = timeStun
                player.dx = Math.cos(angle) * power
                player.dy = Math.sin(angle) * power
            }
        })

        this.game.getEntities("ball").forEach(ball => {
            const distance = super.distance(ball)
            if (distance <= explostionRad) {
                const angle = Math.atan2(ball.y - this.y, ball.x - this.x)
                const ratio = 1 - distance / explostionRad
                const power = ratio * (this.explosionBall.max - this.explosionBall.min) + this.explosionBall.min
                ball.dx = Math.cos(angle) * power
                ball.dy = Math.sin(angle) * power
            }
        })

        const explode = this.game.addEvent(
            "explosion",
            {
                id: this.id,
                x: this.x,
                y: this.y,
                radius: explostionRad,
            },
            this.id
        )

        this.game.addEntity("particle", {
            x: this.x,
            y: this.y,
            radius: this.explosionRadius,
            life: 30,
            name: "explosion",
        })

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
            })
        }
    }

    getPlayer() {
        return this.game.getEntity(this.player)
    }

    update() {
        if (this.explosionTime == 0) {
            this.explode()
            this.game.deleteEntity(this.id)
            return
        }

        this.explosionTime--

        if (Math.abs(this.dx) > this.maxspeed) this.dx = this.maxspeed * Math.sign(this.dx)

        super.update()
    }

    getStateAttributes() {
        return [...super.getStateAttributes(), "player", "state", "explosionTime"]
    }

    getChecksum() {
        return super.getChecksum() + this.state + this.explosionTime
    }
}
