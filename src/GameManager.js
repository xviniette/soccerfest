import StateManager from "./states/StateManager.js"

import PreloaderState from "./states/PreloaderState.js"
import GameState from "./states/GameState.js"
// import GameState from "./states/DebugGameState.js"
import HomeState from "./states/HomeState.js"
import LobbyState from "./states/LobbyState.js"

import Peers from "./engine/Peers.js"

export default class {
    constructor() {
        this.canvas = document.createElement("canvas")
        document.body.appendChild(this.canvas)
        this.ctx = this.canvas.getContext("2d")

        this.assets = {}
        this.animations = {}

        this.settings = {
            name: "Playername",
            controls: {
                jump: ["ArrowUp", "KeyW"],
                left: ["ArrowLeft", "KeyA"],
                right: ["ArrowRight", "KeyD"],
                up: ["ArrowDown", "KeyS"],
                kick: ["Space", "Enter"],
            },
            reverseControls: true,
            music: 1,
            sound: 1,
        }

        this.loadSettings()

        this.peers = new Peers({
            channels: {
                netcode: { options: { ordered: false }, binaryType: "arraybuffer" },
                lobby: { options: { ordered: true } },
            },
        })

        this.stateManager = new StateManager()
            .addState("preloader", new PreloaderState({ game: this }))
            .addState("home", new HomeState({ game: this }))
            .addState("lobby", new LobbyState({ game: this }))
            .addState("game", new GameState({ game: this }))
            .setState("preloader")

        this.update()

        window.addEventListener("resize", () => this.resize())
        this.resize()
    }

    saveSettings() {
        localStorage.setItem("settings", JSON.stringify(this.settings))
    }

    loadSettings() {
        const value = localStorage.getItem("settings")
        if (value) this.settings = { ...this.settings, ...JSON.parse(value) }
    }

    update() {
        requestAnimationFrame(() => this.update())
        this.stateManager?.update()
    }

    resize() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }
}
