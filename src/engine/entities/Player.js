import Entity from "../Entity.js"

export default class extends Entity {
    constructor(json) {
        super()
        this.clientId
        this.name = "Player"
        this.team = 1
        this.emote
        this.emoteTime = 0

        this.speed
        this.jump
        this.bombImpulsion

        this.direction = 1
        this.normalFriction = { x: 0, y: 0 }
        this.normalBounce = { x: 0, y: 0 }
        this.stunFriction = { x: 0, y: 0 }
        this.stunBounce = { x: 0, y: 0 }
        this.deltaAction

        this.inputs = {}

        this.kicked = false
        this.uped = false

        this.lastAction = 0
        this.stun = 0

        this.init(json)
    }

    static getType() {
        return "player"
    }

    setTeam(team) {
        this.team = team
    }

    setSpectator() {
        this.setTeam(0)
    }

    isSpectator() {
        return this.team == 0
    }

    hasBomb() {
        return this.game.getEntities("bomb").find(b => b.player == this.id)
    }

    setEmote(emote) {
        this.emote = emote
        this.emoteTime = 120
    }

    setInputs(inputs = {}) {
        this.inputs = inputs
    }

    update() {
        let inputs = this.inputs || {}

        if (this.isStun()) {
            this.friction = this.stunFriction
            this.bounce = this.stunBounce
        } else {
            this.friction = this.normalFriction
            this.bounce = this.normalBounce
        }

        if (!this.isStun()) {
            let direction = 0
            if (inputs.l) direction = -1
            if (inputs.r) direction = 1

            if (direction != 0) {
                this.direction = direction
                this.dx = direction * this.speed
            }

            if (inputs.j && this.onGround) {
                this.game.addEvent("jump")
                this.dy = this.jump
            }

            if (inputs.k && !this.kicked && this.lastAction == 0 && !this.isSpectator()) {
                let hasCollision = false

                this.game.getEntities("ball").forEach(ball => {
                    if (this.hasCollision(ball)) {
                        this.game.addEvent("kick")
                        ball.kicked(this)
                        hasCollision = true
                    }
                })

                this.game.getEntities("bomb").forEach(bomb => {
                    if (this.hasCollision(bomb)) {
                        this.game.addEvent("kick")
                        bomb.kicked(this)
                        hasCollision = true
                    }
                })

                if (!hasCollision) {
                    if (!this.hasBomb()) {
                        this.game.addEvent("up")
                        this.game.addBomb({ player: this.id })

                        if (!this.onGround && this.dy > this.bombImpulsion) {
                            this.dy = this.bombImpulsion
                            this.lastAction = this.deltaAction
                        }
                    }
                } else {
                    this.lastAction = this.deltaAction
                }
            }

            if (inputs.u && !this.uped && this.lastAction == 0 && !this.isSpectator()) {
                this.game.getEntities("ball").forEach(ball => {
                    if (this.hasCollision(ball)) {
                        this.game.addEvent("up")
                        ball.uped(this)
                    }
                })

                this.game.getEntities("bomb").forEach(bomb => {
                    if (this.hasCollision(bomb)) {
                        this.game.addEvent("up")
                        bomb.uped(this)
                    }
                })
            }
        } else {
            this.stun--
        }

        if (this.lastAction > 0) this.lastAction--

        if (this.emoteTime > 0) this.emoteTime--
        if (this.emoteTime == 0) this.emote = null

        this.kicked = inputs.k ? 1 : 0
        this.uped = inputs.u ? 1 : 0

        super.update()
    }

    isStun() {
        return this.stun > 0
    }

    getStateAttributes() {
        return [...super.getStateAttributes(), "clientId", "name", "team", "lastAction", "stun", "direction", "uped", "kicked", "onGround"]
    }

    getChecksum() {
        return super.getChecksum() + this.stun
    }
}
