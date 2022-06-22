import Entity from "./Entity.js"
import Ball from "./entities/Ball.js"
import Bomb from "./entities/Bomb.js"
import Player from "./entities/Player.js"
import Particle from "./entities/Particle.js"

import Map from "./Map.js"
import maps from "../data/maps.js"

import GameConfigs from "./GameConfigs.js"
import Seed from "./Seed.js"

import COMMANDS from "./COMMANDS.js"

export default class {
    constructor(json) {
        this.tick = 0

        this.map

        this.entityId = 0
        this.entities = []

        this.score = { 1: 0, 2: 0 }

        this.STATES = {
            WARMUP: 10 * 60,
            PLAYING: 5 * 60 * 60,
            END: 5 * 60,
        }

        this.seed = 0

        this.state
        this.stateTime = -1
        this.spawnBallTime = -1

        this.events = []

        Object.assign(this, json)

        this.setCurrentState("WARMUP")
    }

    setMap(mapId) {
        let map = maps.find(m => m.id == mapId)
        if (!map) return
        this.map = new Map(map)

        this.getEntities("player").forEach(entity => {
            entity.x = this.map.playerSpawn.x
            entity.y = this.map.playerSpawn.y
        })
    }

    update(clients) {
        if (!this.state == null) return
        if (!this.map) return

        this.tick++

        if (this.stateTime > 0) this.stateTime--

        switch (this.state) {
            case "WARMUP":
                this.deleteEntities("ball")
                if (this.isStateOver()) {
                    this.setCurrentState("PLAYING")
                    this.spawnBall()
                }
                break
            case "PLAYING":
                if (this.isStateOver()) this.end()
                break
        }

        if (this.spawnBallTime > -1) this.spawnBallTime--
        if (this.spawnBallTime == 0) this.spawnBall()

        clients.forEach(client => {
            let player = this.getPlayer(client.id)

            if (!player) return

            if (client.command) {
                client.command.forEach(cmd => {
                    const [type, ...value] = cmd
                    switch (type) {
                        case COMMANDS.INPUTS:
                            const inputs = value[0].toString(2)
                            player.setInputs({
                                l: inputs.at(-1) * 1 ? 1 : 0,
                                r: inputs.at(-2) * 1 ? 1 : 0,
                                j: inputs.at(-3) * 1 ? 1 : 0,
                                k: inputs.at(-4) * 1 ? 1 : 0,
                                u: inputs.at(-5) * 1 ? 1 : 0,
                            })
                            break
                    }
                })
            }
        })

        this.getEntities("player")
            .filter(player => !player.isSpectator())
            .forEach(e => e.update())
        this.getEntities("bomb").forEach(e => e.update())
        this.getEntities("ball").forEach(e => e.update())
        this.getEntities("particle").forEach(e => e.update())
        this.clearEvents(this.tick - 50)
    }

    end() {
        this.setCurrentState("END")
        this.deleteEntities("ball")
        this.spawnBallTime = -1
    }

    getPlayer(clientId) {
        return this.getEntities("player").find(p => p.clientId == clientId)
    }

    addPlayer(p = {}) {
        p.x = this.map.playerSpawn.x
        p.y = this.map.playerSpawn.y
        return this.addEntity("player", p)
    }

    deletePlayer(playerId) {
        const p = this.getPlayer(clientId)
        if (p) this.deleteEntity(p.id)
    }

    spawnBallIn(time) {
        if (this.spawnBallTime < 0) this.spawnBallTime = time
    }

    spawnBall(data = {}) {
        if (!this.map) return

        this.spawnBallTime = -1

        this.deleteEntities("ball")

        const ballSpawns = this.map.ballSpawns
        const pos = ballSpawns[Math.floor(Seed(this.seed + this.tick) * ballSpawns.length)]

        data.x = pos.x
        data.y = pos.y

        this.addEvent("spawn")

        return this.addEntity("ball", data)
    }

    goal(team) {
        this.score[team]++
        this.addEvent("goal")
    }

    addBomb(data = {}) {
        const bomb = this.addEntity("bomb", data)
        const player = bomb.getPlayer()

        bomb.x = player.x
        bomb.y = player.y

        if (!player.onGround) {
            bomb.dx = bomb.jumpCreation.x * player.direction
            bomb.dy = bomb.jumpCreation.y
        }

        return bomb
    }

    addEntity(type, entity = {}) {
        let entityClass = [Entity, Player, Ball, Bomb, Particle].find(e => e.getType() == type)
        const e = new entityClass({
            ...(GameConfigs[type] ?? {}),
            ...entity,
            game: this,
        })
        this.entities.push(e)
        return e
    }

    getEntity(id) {
        return this.entities.find(e => e.id == id)
    }

    getEntities(type) {
        if (!type) return this.entities
        return this.entities.filter(e => e.type == type)
    }

    deleteEntity(id) {
        this.entities = this.entities.filter(e => e.id != id)
    }

    deleteEntities(type) {
        this.entities = this.entities.filter(e => e.type != type)
    }

    isStateOver() {
        return this.stateTime == 0
    }

    setCurrentState(STATE) {
        if (!this.STATES[STATE]) return
        this.state = STATE
        this.stateTime = this.STATES[STATE]
    }

    addEvent(type, data, id) {
        if (id && this.events.find(e => e.tick == this.tick && e.id == id)) return false

        this.events.push({ type, data, id, tick: this.tick, done: false })
        return true
    }

    clearEvents(tick = 0) {
        this.events = this.events.filter(e => e.tick > tick)
    }

    getState() {
        return JSON.stringify({
            tick: this.tick,
            state: this.state,
            stateTime: this.stateTime,
            map: this.map.id,
            spawnBallTime: this.spawnBallTime,
            score: this.score,
            entities: this.entities.map(entity => entity.getState()),
        })
    }

    setState(data) {
        data = JSON.parse(data)
        const d = { ...data }
        delete d.entities
        delete d.map

        Object.assign(this, d)

        this.setMap(data.map)

        this.entities = []
        data.entities.forEach(entity => this.addEntity(entity.type, entity))
    }

    getChecksum() {
        let sum = this.tick

        this.entities.forEach(entity => {
            sum += entity.getChecksum()
        })

        return sum
    }
}
