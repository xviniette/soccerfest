import COMMANDS from "../engine/COMMANDS.js"
import Netcode from "../engine/Netcode.js"
import World from "../engine/World.js"
import drawMap from "../modules/drawMap.js"
import State from "./State.js"

export default class extends State {
    constructor(json) {
        super(json)

        window.game = this

        this.world
        this.netcode

        this.game.peers.on("netcode-close", data => this.netcode && this.netcode.closePeer(data.peer.id))
        this.game.peers.on("netcode-message", data => this.netcode && this.netcode.onData(data.peer.id, data.event.data))
    }

    onStart({ map, players, serverId, clientId, seed }) {
        super.onStart()

        const { peers } = this.game
        this.world = new World({ seed: seed || 0 })
        this.world.setMap(map)
        players.forEach(player => this.world.addPlayer({ ...player }))

        const _this = this

        this.netcode = new Netcode({
            clientId: clientId,
            serverId: serverId,
            sendTo: (peerId, data) => peers.sendTo(peerId, data, "netcode"),
            close: peerId => peers.removePeer(peerId),
            step: clients => _this.world.update(clients),
            checksum: () => _this.world.getChecksum(),
            getState: () => _this.world.getState(),
            setState: state => _this.world.setState(state),
        })

        players.forEach(player => this.netcode.addClient({ id: player.clientId, peerId: player.peerId }))

        if (this.netcode.isServer()) this.netcode.start()

        this.game.assets.music.loop = true
        this.game.assets.music.volume = 0.5
        this.game.assets.music.play()
    }

    onEnd() {
        this.game.assets.music.pause()
        this.game.assets.music.currentTime = 0
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
        this.netcode.addCommand([COMMANDS.INPUTS, this.getInputs()])
        this.netcode.update()

        this.render({
            game: this,
            online: this.netcode,
            world: this.world,
            assets: this.game.assets,
        })

        if (this.world.state == "END" && this.world.isStateOver()) {
            this.setState("lobby")
        }
    }

    render({ game, online, world, assets }) {
        const { ctx, canvas } = this.game

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const map = world.map

        const tilesize = Math.min(canvas.width / map.tiles.length, canvas.height / map.tiles[0].length)
        const offset = {
            x: (canvas.width - map.tiles.length * tilesize) / 2,
            y: (canvas.height - map.tiles[0].length * tilesize) / 2,
        }

        const data = { game, online, world, tilesize, offset, assets }

        this.drawGame(data)
        this.drawUI(data)

        //EVENTS
        this.world.events.forEach(event => {
            if (event.done) return

            event.done = true

            switch (event.type) {
                case "jump":
                    this.playSound("jump", 0.5)
                    break
                case "explosion":
                    this.addTrauma(0.5)
                    this.playSound("bomb_audio", 0.5)
                    break
                case "warp":
                    this.playSound("warp", 0.5)
                    break
                case "kick":
                    this.playSound("kick", 0.5)
                    // this.addTrauma(0.2)
                    break
                case "up":
                    // this.addTrauma(0.2)
                    this.playSound("up", 0.5)
                    break
                case "spawn":
                    this.playSound("pop", 0.5)
                    this.addTrauma(0.1)

                    break
                case "goal":
                    this.addTrauma(0.5)
                    this.playSound("goal", 0.5)
                    break
            }
        })
    }

    playSound(name, volume = 1) {
        if (!this.game.assets[name]) return
        const clone = this.game.assets[name].cloneNode(false)
        clone.volume = volume
        clone.play()
    }

    drawSprite(x, y, width, height, asset, animations, options = {}) {
        const { canvas, ctx } = this.game

        if (!Array.isArray(animations)) animations = [animations]

        let index = options.key || 0

        if (options.fps) {
            if (options.delta != undefined) {
                index = Math.floor(options.delta / (1000 / options.fps))
            }

            if (options.tick != undefined) {
                index = Math.floor(options.tick / options.fps)
            }

            index = options.norepeat ? Math.min(index, animations.length - 1) : index % animations.length
        }

        const frame = animations[index]

        if (frame.hitW && frame.width) {
            width = width * (frame.width / frame.hitW)
        }

        if (frame.hitH && frame.height) {
            height = height * (frame.height / frame.hitH)
        }

        if (frame.hitX && frame.width) {
            x -= width * (frame.hitX / frame.width)
        }

        if (frame.hitY && frame.height) {
            y -= height * (frame.hitY / frame.height)
        }

        ctx.drawImage(asset, frame.x, frame.y, frame.width, frame.height, x, y, width, height)
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

    drawGame({ assets, tilesize, offset, world }) {
        const { ctx, canvas, animations } = this.game

        const now = Date.now()

        drawMap({ canvas, ctx, map: world.map, assets, offset, tilesize })

        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.font = `${tilesize * 0.5}px Arial`

        world.getEntities("player").forEach(entity => {
            if (entity.isSpectator()) return

            ctx.fillStyle = "#ffffff"
            if (entity.clientId == this.netcode.clientId) ctx.fillStyle = "#f5f542"
            ctx.fillText(entity.name, offset.x + entity.x * tilesize, offset.y + entity.y * tilesize - tilesize * 2)

            ctx.save()

            if (entity.team == 1) ctx.filter = "hue-rotate(160deg)"
            if (entity.team == 2) ctx.filter = "hue-rotate(250deg)"

            ctx.translate(offset.x + entity.x * tilesize, offset.y + entity.y * tilesize)

            ctx.scale(entity.direction, 1)

            if (entity.stun) {
                this.drawSprite(0, 0, tilesize, tilesize, assets.igor, animations.igor_dead)
            } else {
                if (!entity.onGround) {
                    if (entity.dy > 0) {
                        this.drawSprite(0, 0, tilesize, tilesize, assets.igor, animations.igor_fall, { fps: 20, delta: now })
                    } else {
                        this.drawSprite(0, 0, tilesize, tilesize, assets.igor, animations.igor_jump, { fps: 20, delta: now })
                    }
                } else {
                    if (entity.inputs.l || entity.inputs.r) {
                        this.drawSprite(0, 0, tilesize, tilesize, assets.igor, animations.igor_run, { fps: 20, delta: now })
                    } else {
                        this.drawSprite(0, 0, tilesize, tilesize, assets.igor, animations.igor_idle, { fps: 20, delta: now })
                    }
                }
            }

            ctx.restore()
        })

        ctx.fillStyle = "#ffffff"
        world.getEntities("ball").forEach(entity => {
            ctx.beginPath()
            ctx.arc(offset.x + entity.x * tilesize, offset.y + entity.y * tilesize, entity.radius * tilesize, 0, 2 * Math.PI)
            ctx.fill()
        })

        world.getEntities("bomb").forEach(entity => {
            this.drawSprite(offset.x + entity.x * tilesize, offset.y + entity.y * tilesize, tilesize, tilesize, assets.bomb, animations.bomb, {
                fps: 20,
                delta: now,
            })
        })

        world.getEntities("particle").forEach(entity => {
            ctx.fillStyle = entity.color

            switch (entity.name) {
                case "explosion":
                    ctx.fillStyle = "rgba(255,255,255,0.5)"
                    ctx.beginPath()
                    ctx.arc(offset.x + entity.x * tilesize, offset.y + entity.y * tilesize, entity.radius * tilesize, 0, 2 * Math.PI)
                    ctx.fill()

                    this.drawSprite(
                        offset.x + entity.x * tilesize,
                        offset.y + entity.y * tilesize,
                        tilesize,
                        tilesize,
                        assets.explosion,
                        animations.explosion,
                        { fps: 25, tick: entity.currentLife, norepeat: true }
                    )
                    break

                default:
                    ctx.beginPath()
                    ctx.arc(offset.x + entity.x * tilesize, offset.y + entity.y * tilesize, entity.radius * tilesize, 0, 2 * Math.PI)
                    ctx.fill()
                    break
            }
        })

        // this.screenshake()
    }

    drawUI({ world, online }) {
        const { ctx, canvas } = this.game

        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.font = `20px Arial`

        ctx.textBaseline = "top"
        ctx.font = `${canvas.height * 0.05}px Arial`

        ctx.fillStyle = "#ffffff"
        if (world.stateTime < 5 * 60) ctx.fillStyle = "#ff0000"
        ctx.fillText(this.timeFormat(world.stateTime), canvas.width * 0.5, 0)

        ctx.textAlign = "left"
        ctx.fillStyle = "#649cf5"
        ctx.fillText(world.score[1], canvas.width * 0, 0)
        ctx.textAlign = "right"
        ctx.fillStyle = "#f58b64"
        ctx.fillText(world.score[2], canvas.width * 1, 0)

        ctx.textAlign = "left"
        if (this.netcode.serverId != this.netcode.clientId) {
            ctx.fillText(`${Math.round(this.netcode.getClient(this.netcode.serverId).ping)}ms`, 0, 20)
        }

        if (this.world.state == "END") {
            ctx.fillStyle = "#ffffff"
            let text = "Draw"

            if (this.world.score[1] > this.world.score[2]) {
                ctx.fillStyle = "blue"
                text = "Blue team won"
            }

            if (this.world.score[2] < this.world.score[1]) {
                ctx.fillStyle = "red"
                text = "Red team won"
            }

            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = `${canvas.height * 0.2}px Arial`
            ctx.fillText(text, canvas.width * 0.5, canvas.height * 0.5)
        }

        if (!this.netcode.isSync(0.5)) {
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = `${canvas.height * 0.2}px Arial`
            ctx.fillStyle = "#ff0000"
            ctx.fillText("DESYNC", canvas.width * 0.5, canvas.height * 0.5)
        }
    }

    addTrauma(value) {
        if (!this.trauma) this.trauma = 0

        this.trauma += value
    }

    screenshake() {
        const { ctx, canvas } = this.game
        const value = 100
        const max = 100 ** 3

        this.trauma -= 0.01

        this.trauma = Math.max(Math.min(this.trauma, 1), 0)

        const power = (this.trauma * value) ** 3

        const scale = power / max

        ctx.save()
        const shakeVal = 50
        const shake = shakeVal * scale - shakeVal * 0.5 * scale
        const rotationVal = 0.3
        const rotation = rotationVal * scale - rotationVal * 0.5 * scale

        ctx.translate(canvas.width * 0.5 + Math.random() * shake, canvas.height * 0.5 + Math.random() * shake)
        ctx.rotate(Math.random() * rotation)
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
        ctx.restore()
    }

    timeFormat(time) {
        time = Math.round(time / 60)
        if (time < 0) time = 0
        const minutes = Math.floor(time / 60)
        const secondes = time - minutes * 60
        return `${minutes}:${secondes < 10 ? "0" : ""}${secondes}`
    }
}
