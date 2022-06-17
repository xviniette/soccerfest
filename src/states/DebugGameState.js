import State from "./State.js"
import COMMANDS from "../engine/COMMANDS.js"

import World from "../engine/World.js"
import Netcode from "../engine/Netcode.js"

export default class extends State {
    constructor(json) {
        super(json)

        window.game = this

        this.latency = 100
        this.failSend = 0.1

        this.playingIndex = 1

        this.clients = [
            {
                clientId: 0,
                peerId: 0,
                color: "rgba(255, 0, 0, 0.5)",
            },
            {
                clientId: 1,
                peerId: 1,
                color: "rgba(0, 255, 0, 0.5)",
            },
        ]
    }

    onStart({ map }) {
        const getPeer = peerId => {
            return this.clients.find(c => c.peerId == peerId)
        }

        window.netcodes = {}

        this.clients.forEach(client => {
            client.world = new World()
            client.world.setMap(map)
            this.clients.forEach(c => client.world.addPlayer({ name: c.clientId, clientId: c.clientId }))
            client.netcode = new Netcode({
                tickrate: 60,
                clientId: client.clientId,
                serverId: this.clients[0].clientId,
                sendTo: (peerId, data) => {
                    if (Math.random() < this.failSend) return
                    setTimeout(() => {
                        getPeer(peerId).netcode.onData(client.peerId, data)
                    }, this.latency)
                },
                step: clients => {
                    return client.world.update(clients)
                },
                checksum: () => {
                    return client.world.getChecksum()
                },
                getState: () => {
                    return client.world.getState()
                },
                setState: state => {
                    return client.world.setState(state)
                },
            })

            window.netcodes[client.clientId] = client.netcode

            this.clients.forEach(c => client.netcode.addClient({ id: c.clientId, peerId: c.peerId }))
        })

        this.clients[0].netcode.start()
    }

    getInputs() {
        const controls = this.game.settings.controls

        return parseInt(
            [
                controls.left.some(k => this.isDown(k)) ? 1 : 0,
                controls.right.some(k => this.isDown(k)) ? 1 : 0,
                controls.jump.some(k => this.isDown(k)) ? 1 : 0,
                controls.kick.some(k => this.isDown(k)) ? 1 : 0,
                controls.up.some(k => this.isDown(k)) ? 1 : 0,
            ]
                .reverse()
                .join(""),
            2
        )
    }

    update() {
        const { ctx, canvas } = this.game

        this.clients.forEach((client, index) => {
            if (!client.netcode) return
            if (index == this.playingIndex) client.netcode.addCommand([COMMANDS.INPUTS, this.getInputs()])
            client.netcode.update()
        })

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const map = this.clients[0].world.map

        const tilesize = Math.min(canvas.width / map.tiles.length, canvas.height / map.tiles[0].length)
        const offset = {
            x: (canvas.width - map.tiles.length * tilesize) / 2,
            y: (canvas.height - map.tiles[0].length * tilesize) / 2,
        }

        ctx.fillStyle = "#ffffff"
        for (let x = 0; x < map.tiles.length; x++) {
            for (let y = 0; y < map.tiles[x].length; y++) {
                if (map.isTile(x, y)) {
                    ctx.fillRect(offset.x + x * tilesize, offset.y + y * tilesize, tilesize, tilesize)
                }
            }
        }

        const debugInfos = []

        this.clients.forEach(client => {
            ctx.fillStyle = client.color
            client.world.entities.forEach(entity => {
                ctx.beginPath()
                ctx.arc(offset.x + entity.x * tilesize, offset.y + entity.y * tilesize, entity.radius * tilesize, 0, 2 * Math.PI)
                ctx.fill()
            })

            const server = client.netcode.getClient(client.netcode.serverId)

            debugInfos.push(`======== ${client.clientId} ${client.netcode.isServer() ? "HOST" : ""}========`)
            debugInfos.push(`TICK : ${client.netcode.tick}`)
            debugInfos.push(`PING : ${server.ping}`)
            debugInfos.push(`DTICK : ${client.netcode.tick - server.tick}`)
        })

        const fontSize = 20
        ctx.font = `${fontSize}px serif`
        ctx.textAlign = "left"
        ctx.fillStyle = "#3fcf3a"

        debugInfos.forEach((value, i) => ctx.fillText(value, 10, fontSize * i + fontSize))

        const tick = this.clients[0].netcode.tick - 10
        if (tick < 0) return
    }
}
