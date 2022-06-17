import Query from "../modules/Query.js"
import Tween from "../modules/Tween.js"
import State from "./State.js"

export default class extends State {
    constructor(json) {
        super(json)

        this.titleTween = new Tween({
            time: 5000,
            loop: -1,
            yoyo: true,
            easing: "InOutQuad",
        }).start()

        this.pressKeyTween = new Tween({
            time: 400,
            loop: -1,
            yoyo: true,
            easing: "OutCubic",
        }).start()

        this.onDown(e => {
            if (e.keyCode >= 65 && e.keyCode <= 90) this.game.settings.name += e.key
        })

        this.onKeyDown("Backspace", () => {
            this.game.settings.name = this.game.settings.name.slice(0, -1)
        })

        this.onKeyDown("Enter", () => {
            this.game.saveSettings()
            this.startLobby()
        })
    }

    onStart() {
        // this.startLobby()
    }

    startLobby() {
        const params = Query.get()
        if (params.lobby) {
            Query.delete("lobby")
            this.setState("lobby", { lobby: params.lobby })
        } else {
            this.setState("lobby")
        }
    }

    update(dt) {
        const { ctx, canvas, assets } = this.game

        //BG
        const { width: imgWidth, height: imgHeight } = assets.splashbg
        const dWidth = (imgWidth / imgHeight) * canvas.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < Math.ceil(canvas.width / dWidth); i++) ctx.drawImage(assets.splashbg, dWidth * i, 0, dWidth, canvas.height)

        //SNOW
        this.renderSnow(dt)

        //TITLE
        const titleHeight = Math.min(canvas.height * 0.4, canvas.width * 0.4)
        const titleWidth = (assets.title.width / assets.title.height) * titleHeight

        ctx.drawImage(
            assets.title,
            canvas.width / 2 - titleWidth / 2,
            canvas.height * 0.2 - assets.title.height * 0.5 + this.titleTween.getRatio() * canvas.height * 0.1,
            titleWidth,
            titleHeight
        )

        //USERNAME
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.1)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.pressKeyTween.getRatio()})`
        ctx.font = `${Math.min(canvas.height * 0.07, canvas.width * 0.08)}px Arial`
        ctx.fillStyle = "#ffffff"
        ctx.textBaseline = "middle"
        ctx.textAlign = "center"
        ctx.fillText(this.game.settings.name, canvas.width * 0.5, canvas.height * 0.65)

        //PRESS KEY
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.1)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.pressKeyTween.getRatio()})`
        ctx.font = `${Math.min(canvas.height * 0.07, canvas.width * 0.08)}px Arial`
        ctx.textBaseline = "middle"
        ctx.textAlign = "center"
        ctx.fillText(`Press ENTER to start`, canvas.width * 0.5, canvas.height * 0.85)
    }

    renderSnow(dt) {
        const { ctx, canvas } = this.game

        const deltaSpawn = 100

        if (!this.flakeSpawn) this.flakeSpawn = Date.now()

        if (!this.flakes) {
            this.flakes = []

            for (let i = 0; i < 100; i++) {
                this.spawnFlake()
            }
        }

        if (Date.now() > this.flakeSpawn + deltaSpawn) {
            for (let i = 0; i < 5; i++) {
                this.spawnFlake(Math.random() * 2 - 1, -0.1)
            }

            this.flakeSpawn = Date.now()
        }

        this.flakes.forEach(flake => {
            flake.x += flake.dx * dt
            flake.y += flake.dy * dt

            ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`

            ctx.beginPath()
            ctx.arc(flake.x * canvas.width, flake.y * canvas.height, flake.radius * canvas.height, 0, 2 * Math.PI)
            ctx.fill()
        })

        this.flakes = this.flakes.filter(flake => flake.y < 1.1)
    }

    spawnFlake(x, y) {
        this.flakes.push({
            x: x ?? Math.random(),
            y: y ?? Math.random(),
            opacity: Math.random() * 0.5 + 0.5,
            dx: Math.random() * 0.1 + 0.01,
            dy: Math.random() * 0.3 + 0.1,
            radius: Math.random() * 0.005 + 0.002,
        })
    }
}
