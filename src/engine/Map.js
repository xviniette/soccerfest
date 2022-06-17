export default class {
    constructor(json) {
        this.id
        this.name
        this.tiles
        this.playerSpawn = {}
        this.ballSpawns = []

        Object.assign(this, json)
    }

    isOut(x, y) {
        return (
            x < 0 ||
            x >= this.tiles.length ||
            y < 0 ||
            y >= this.tiles[0].length
        )
    }

    getTile(x, y) {
        if (this.isOut(x, y)) return null
        return this.tiles[x][y]
    }

    isEmpty(x, y) {
        if (this.isOut(x, y)) return false
        return this.getTile(x, y).type == undefined
    }

    isBlock(x, y) {
        return this.isOut(x, y) || this.isTile(x, y)
    }

    isTile(x, y) {
        if (this.isOut(x, y)) return false
        return this.getTile(x, y).type === "block"
    }

    isWarp(x, y) {
        const tile = this.getTile(x, y)
        if (!tile || tile.type != "warp") return false
        if (tile.x == undefined || tile.y == undefined) return false
        return tile
    }

    isGoal(x, y) {
        const tile = this.getTile(x, y)
        if (!tile || tile.type != "goal") return false
        return tile.team
    }
}
