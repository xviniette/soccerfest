export default class {
    constructor(json = {}) {
        this.id = Math.floor(Math.random() * 9999999999)

        this.caller = false

        this.RTCConfiguration = {}

        this.channels = {
            default: { options: { ordered: false }, binaryType: "arraybuffer" },
        }

        this.dataChannels = {}

        this.data = {}

        this.peers

        this.init(json)
    }

    init(json) {
        Object.assign(this, json)
    }

    start() {
        this.peerConnection = new RTCPeerConnection(this.RTCConfiguration)

        const candidates = []

        this.peerConnection.onicecandidate = e => {
            if (e.candidate) return candidates.push(e.candidate)

            this.peers.emit("peer", {
                id: this.id,
                description: this.peerConnection.localDescription,
                candidates: candidates,
                data: this.data,
                isCaller: this.caller,
            })
        }

        this.peerConnection.oniceconnectionstatechange = e => {
            if (
                this.peerConnection.iceConnectionState == "failed" ||
                this.peerConnection.iceConnectionState == "disconnected" ||
                this.peerConnection.iceConnectionState == "closed"
            ) {
                this.close()
            }
        }

        if (this.caller) {
            this.peerConnection.onnegotiationneeded = () => {
                this.peerConnection.createOffer().then(description => {
                    return this.peerConnection.setLocalDescription(description)
                })
            }

            for (let channel in this.channels) {
                let datachannel = this.peerConnection.createDataChannel(channel, this.channels[channel].options)

                if (this.channels[channel].binaryType) {
                    datachannel.binaryType = this.channels[channel].binaryType
                }

                this.setChannel(datachannel)
            }
        } else {
            this.peerConnection.ondatachannel = e => this.setChannel(e.channel)
        }
    }

    setRemoteDescription(description) {
        if (this.peerConnection.connectionState == "closed") return

        this.peerConnection.setRemoteDescription(new RTCSessionDescription(description)).then(() => {
            if (this.peerConnection.remoteDescription.type != "offer") return
            this.peerConnection.createAnswer().then(description => {
                this.peerConnection.setLocalDescription(description)
            })
        })
    }

    setRemoteIceCandidates(candidates) {
        if (this.peerConnection.connectionState == "closed") return

        candidates.forEach(candidate => {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        })
    }

    setChannel(channel) {
        channel.onopen = e => {
            this.peers.emit("open", { peer: this, event: e, channel })
            this.peers.emit(`${channel.label}-open`, { peer: this, event: e, channel })
        }

        channel.onclose = e => {
            this.peers.emit("close", { peer: this, event: e, channel })
            this.peers.emit(`${channel.label}-close`, { peer: this, event: e, channel })
            this.peers.removePeer(this.id)
        }

        channel.onmessage = e => {
            this.peers.emit("message", { peer: this, event: e, channel })
            this.peers.emit(`${channel.label}-message`, { peer: this, event: e, channel })
        }

        this.dataChannels[channel.label] = channel
    }

    send(data, channel) {
        if (!channel) channel = "default"

        if (!this.dataChannels[channel]) return

        try {
            this.dataChannels[channel].send(data)
        } catch (error) {
            this.logError(error)
        }
    }

    close() {
        try {
            this.peerConnection.close()
        } catch (error) {
            this.logError(error)
        }
    }

    removePeer() {
        if (!this.peers) return

        this.peers.removePeer(this.id)
        this.peers.emit("close", { peer: this })
    }

    logError(error) {
        console.trace(`${error.name} : ${error.message}`)
    }
}
