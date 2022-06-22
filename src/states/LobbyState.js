import maps from "../data/maps.js"
import Map from "../engine/Map.js"
import drawMap from "../modules/drawMap.js"
import JSONCrush from "../modules/JSONCrush.js"
import State from "./State.js"

export default class extends State {
    constructor(json) {
        super(json)

        new BroadcastChannel("soccerfest").addEventListener("message", e => {
            if (this.isHost()) this.game.peers.setPeer(JSON.parse(JSONCrush.uncrush(e.data)))
        })

        this.game.peers.on("lobby-open", data => {
            if (this.isHost()) this.addPlayer({ peerId: data.peer.id })
        })

        this.game.peers.on("lobby-close", data => {
            if (this.isHost()) {
                this.removePlayer(data.peer.id)
            } else {
                this.reset()
            }
        })

        this.game.peers.on("lobby-message", data => {
            const { type, ...message } = JSON.parse(data.event.data)

            const player = this.players.find(player => player.peerId == data.peer.id)

            switch (type) {
                case "lobby":
                    if (this.isHost()) return

                    const firstConnection = this.host == null

                    Object.assign(this, message.data)
                    this.getPlayer(this.host).peerId = data.peer.id
                    if (firstConnection) this.sendUpdateToHost({ name: this.game.settings.name })
                    break

                case "update":
                    if (player) this.setPlayerData(player.clientId, message.data)
                    break

                case "start":
                    if (this.isHost()) return
                    this.setState("game", message.data)
                    break

                case "ping":
                    if (player) this.setPlayerData(player.clientId, message.data)

                    this.sendTo(player.clientId, { type: "pong", timestamp: message.timestamp })
                    break

                case "pong":
                    this.sendUpdateToHost({ ping: Date.now() - message.timestamp })
                    break
            }
        })

        this.game.peers.on("peer", data => {
            const token = encodeURIComponent(JSONCrush.crush(JSON.stringify(data)))
            let url = data.isCaller ? `${location.origin}${location.pathname}?lobby=${token}` : `${location.origin}${location.pathname}?peer=${token}`

            navigator.permissions.query({ name: "clipboard-write" }).then(() => {
                navigator.clipboard.writeText(url).then(() => (this.clipboard = Date.now()))
            })
        })

        this.onKeyDown("ArrowLeft", () => this.isActive() && this.changeTeam(-1))
        this.onKeyDown("ArrowRight", () => this.isActive() && this.changeTeam(1))
        this.onKeyDown("ArrowUp", () => this.isActive() && this.setMap(1))
        this.onKeyDown("ArrowDown", () => this.isActive() && this.setMap(-1))
        this.onKeyDown("Enter", () => this.isActive() && this.startGame())
        this.onKeyDown("KeyP", () => this.isActive() && this.isHost() && this.game.peers.setPeer({ caller: true }))

        setInterval(() => {
            this.sendTo(this.host, { type: "ping", timestamp: Date.now() })
        }, 1000)
    }

    onStart({ lobby }) {
        this.set(lobby)
    }

    set(lobby) {
        if (!this.hasJoined()) {
            this.clientIdIncrement = 0
            this.clientId
            this.host
            this.players = []
            this.map = maps[0].id

            this.clipboard = 0

            if (lobby) {
                this.game.peers.setPeer(JSON.parse(JSONCrush.uncrush(lobby)))
            } else {
                const p = this.addPlayer({ name: this.game.settings.name, host: true })
                this.clientId = p.clientId
                this.host = this.clientId
            }
        }
    }

    reset() {
        this.host = null
        this.set()
    }

    hasJoined() {
        return this.host != null
    }

    isHost() {
        return this.hasJoined() && this.host == this.clientId
    }

    getPlayer(clientId) {
        return this.players?.find(player => player.clientId == clientId)
    }

    addPlayer(data) {
        const nbPlayers = {
            blue: this.players.filter(player => player.team == -1).length,
            red: this.players.filter(player => player.team == 1).length,
        }

        const player = { clientId: this.clientIdIncrement++, ping: 0, team: nbPlayers.blue > nbPlayers.red ? 1 : -1, ...data }
        this.players.push(player)
        this.sendLobby()
        return player
    }

    removePlayer(peerId) {
        this.players = this.players.filter(player => player.peerId != peerId)
        this.sendLobby()
    }

    startGame() {
        if (!this.isHost()) return

        const players = this.players.map(({ name, team, clientId, peerId }) => ({ name, team: team < 0 ? 1 : team > 0 ? 2 : 0, clientId, peerId }))

        const seed = Math.floor(Math.random() * 9999999)

        this.setState("game", { map: this.map, players, serverId: this.host, clientId: this.clientId, seed })

        this.players.forEach(player =>
            this.sendTo(player.clientId, {
                type: "start",
                data: {
                    map: this.map,
                    players: players.map(p => ({ ...p, peerId: p.clientId == this.host ? p.peerId : null })),
                    serverId: this.host,
                    clientId: player.clientId,
                    seed,
                },
            })
        )
    }

    setMap(delta) {
        if (!this.isHost()) return

        let index = maps.findIndex(map => map.id == this.map) + delta
        if (index < 0) index = maps.length - 1
        if (index >= maps.length) index = 0

        this.map = maps[index].id
        this.sendLobby()
    }

    changeTeam(delta) {
        const p = this.getPlayer(this.clientId)
        if (!p) return

        let team = p.team + delta
        team = Math.min(Math.max(team, -1), 1)

        this.setPlayerData(this.clientId, { team })
        this.sendUpdateToHost({ team })
    }

    sendTo(clientId, data = {}) {
        const player = this.getPlayer(clientId)
        if (!player) return

        this.game.peers.sendTo(player.peerId, JSON.stringify(data), "lobby")
    }

    sendUpdateToHost(data) {
        if (this.isHost()) return

        this.sendTo(this.host, { type: "update", data })
    }

    setPlayerData(clientId, data) {
        if (!this.isHost()) return
        Object.assign(this.getPlayer(clientId), data)
        this.sendLobby()
    }

    sendLobby() {
        if (!this.isHost()) return

        this.players.forEach(player =>
            this.sendTo(player.clientId, {
                type: "lobby",
                data: {
                    players: this.players,
                    map: this.map,
                    host: this.host,
                    clientId: player.clientId,
                },
            })
        )
    }

    joiningRender() {
        const { ctx, canvas } = this.game

        const add = ((Date.now() % 1000) / 1000) * Math.PI * 2
        ctx.strokeStyle = "#ffffff"
        ctx.fillStyle = "#ffffff"

        ctx.lineWidth = canvas.height * 0.01
        ctx.beginPath()
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height * 0.1, add, Math.PI * 1.6 + add)
        ctx.stroke()

        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        ctx.font = `${canvas.height * 0.05}px Arial`
        ctx.fillText("Joining...", canvas.width * 0.5, canvas.height * 0.35)

        ctx.textBaseline = "top"
        ctx.font = `${canvas.height * 0.03}px Arial`

        if (this.clipboard) {
            ctx.fillText("A link as been copied to your clipboard. Paste it back to the host", canvas.width * 0.5, canvas.height * 0.65)
        }
    }

    update() {
        const { ctx, canvas, assets } = this.game

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (!this.hasJoined()) return this.joiningRender()

        if (!this.mapInstance || this.mapInstance.id != this.map) {
            this.mapInstance = new Map(maps.find(m => m.id == this.map))
        }

        const tilesize = Math.min(canvas.width / this.mapInstance.tiles.length, canvas.height / this.mapInstance.tiles[0].length)
        const offset = {
            x: (canvas.width - this.mapInstance.tiles.length * tilesize) / 2,
            y: (canvas.height - this.mapInstance.tiles[0].length * tilesize) / 2,
        }

        drawMap({ canvas, ctx, map: this.mapInstance, assets, offset, tilesize })

        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const panelWidth = 0.3

        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"

        ctx.fillStyle = "rgba(0, 0, 255, 0.7)"
        ctx.fillRect(0, canvas.height * 0.2, canvas.width * panelWidth, canvas.height * 0.6)

        ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
        ctx.fillRect(canvas.width - canvas.width * panelWidth, canvas.height * 0.2, canvas.width * panelWidth, canvas.height * 0.6)

        ctx.fillStyle = "#ffffff"

        ctx.font = `${Math.min(canvas.height * 0.04, canvas.width * 0.03)}px Arial`

        ctx.textBaseline = "top"
        this.players.forEach((player, index) => {
            const x = canvas.width * 0.5 + player.team * (canvas.width / 2 - canvas.width * 0.5 * panelWidth)
            const y = canvas.height * 0.25 + index * 50
            const measure = ctx.measureText(player.name)

            if (player.clientId == this.clientId) {
                if (player.team != -1) ctx.fillText("◀", x - measure.width * 0.8, y)
                if (player.team != 1) ctx.fillText("▶", x + measure.width * 0.8, y)
            }

            ctx.fillText(`${player.name}`, x, y)
        })

        //MAP
        ctx.fillStyle = "#ffffff"
        ctx.fillText(`${this.mapInstance.name}`, canvas.width * 0.5, canvas.height * 0.05)

        if (this.isHost()) {
            ctx.fillText("▲", canvas.width * 0.5, canvas.height * 0.0)
            ctx.fillText("▼", canvas.width * 0.5, canvas.height * 0.1)

            ctx.textBaseline = "bottom"
            ctx.textAlign = "right"
            ctx.fillText("Press ENTER to start", canvas.width * 0.98, canvas.height * 0.98)

            ctx.textAlign = "left"
            let text = "Press P to add a player"
            if (Date.now() - this.clipboard < 3000) text = "Share the link copied to your clipboard"
            ctx.fillText(text, canvas.width * 0.02, canvas.height * 0.98)
        } else {
            ctx.fillStyle = "#ffffff"

            ctx.textAlign = "center"
            ctx.textBaseline = "bottom"
            ctx.fillText("Wait for the host to start the game", canvas.width * 0.5, canvas.height * 0.98)
        }
    }
}
