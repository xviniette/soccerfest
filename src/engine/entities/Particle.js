import Entity from "../Entity.js"

export default class extends Entity {
    constructor(json) {
        super(json)

        this.name

        this.life = -1

        this.physic = true

        this.currentLife = 0

        this.color = "#ffffff"

        this.init(json)
    }

    static getType() {
        return "particle"
    }

    update() {
        if (this.getTimeLeft() == 0) return this.game.deleteEntity(this.id)
        this.currentLife++

        if (this.physic) {
            super.update()
        }
    }

    getTimeLeft() {
        return this.life - this.currentLife
    }

    getChecksum() {
        return 0
    }

    getStateAttributes() {
        return [...super.getStateAttributes(), "life", "currentLife", "name", "physic", "color"]
    }
}
