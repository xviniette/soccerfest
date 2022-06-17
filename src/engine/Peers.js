import Peer from "./Peer.js"
import EventEmitter from "../modules/EventEmitter.js"

export default class extends EventEmitter {
    constructor(json) {
        super()

        this.peers = []

        this.RTCConfiguration = {
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
                    ],
                },
            ],
        }

        this.channels = {
            default: {
                options: { ordered: false },
                binaryType: "arraybuffer",
            },
        }

        this.init(json)
    }

    init(json) {
        Object.assign(this, json)
    }

    setPeer(data = {}) {
        let peer = this.getPeer(data.id)
        if (!data.id || !peer) {
            peer = this.addPeer(data)
        } else {
            peer.init(data)
        }

        if (data.description) peer.setRemoteDescription(data.description)
        if (data.candidates) peer.setRemoteIceCandidates(data.candidates)
    }

    addPeer(data = {}) {
        const p = new Peer({ RTCConfiguration: this.RTCConfiguration, channels: this.channels, ...data, peers: this })
        p.start()

        this.peers.push(p)
        return p
    }

    getPeer(id) {
        return this.peers.find(p => p.id == id)
    }

    sendTo(id, data, channel) {
        this.getPeer(id)?.send(data, channel)
    }

    removePeer(id) {
        this.getPeer(id)?.close()
    }

    removeAll() {
        this.peers.forEach(peer => peer.close())
    }
}
