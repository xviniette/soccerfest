import EventEmitter from "./EventEmitter.js"

export default class extends EventEmitter {
    constructor() {
        super()
    }

    load(assets) {
        return new Promise((resolve, reject) => {
            const loaded = {}

            let nbAssets = 0
            let loadedAssets = 0

            this.emit("progress", 0)

            const triggerLoad = () => {
                loadedAssets += 1

                this.emit("progress", loadedAssets / nbAssets)

                if (loadedAssets == nbAssets) resolve(loaded)
            }

            for (const type in assets) {
                for (const name in assets[type]) {
                    let element
                    nbAssets += 1

                    switch (type) {
                        case "image":
                            element = new Image()
                            element.addEventListener("load", () => {
                                loaded[name] = element
                                triggerLoad()
                            })

                            element.onerror = () => triggerLoad()

                            element.src = assets[type][name]
                            break

                        case "audio":
                            element = new Audio()
                            element.src = assets[type][name]
                            element.addEventListener("canplaythrough", () => {
                                loaded[name] = element
                                triggerLoad()
                            })

                            break

                        default:
                            break
                    }
                }
            }
        })
    }
}
