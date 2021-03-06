import GameManager from "./GameManager.js"
import Query from "./modules/Query.js"

const query = Query.get()

if (query.peer) {
    const bc = new BroadcastChannel("soccerfest")
    bc.postMessage(query.peer)
    const title = document.createElement("h1")
    title.style = "font-size:5em;"
    title.innerText = "The player has been added. You can close this tab."
    document.body.appendChild(title)
} else {
    new GameManager()
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("./static/pwa/sw.js")
        .then(reg => {})
        .catch(error => {})
}
