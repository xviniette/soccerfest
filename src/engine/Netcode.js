export default class {
    constructor(json) {
        this.tickrate = 60

        this.clientId
        this.serverId

        this.clients = []

        this.tick = -1

        this.delay = 0
        this.rollback = 20

        this.savedState
        this.savedStateTick = -1

        this._tickCommands = []

        this.sendTo = (peerId, data) => {}
        this.close = peerId => {}
        this.step = clients => {}
        this.getState = () => null
        this.setState = state => {}
        this.checksum = () => 0

        Object.assign(this, json)
    }

    start() {
        this.tick = 0

        this.savedStateTick = -1
        this.savedState = this.getState()
    }

    hasStarted() {
        return this.tick >= 0
    }

    update() {
        const now = Date.now()
        if (!this.lastTick) this.lastTick = now

        const interval = 1000 / this.tickrate
        const delta = now - this.lastTick
        this.lastTick = now - (delta % interval)

        if (!this.hasStarted()) return

        let ticks = Math.min(Math.floor(delta / interval), this.tickrate)

        if (!this.isServer()) {
            const server = this.getClient(this.serverId)
            const target = server.tick + Math.round(server.ping / 2 / (1000 / this.tickrate))
            ticks += target - this.tick
        }

        this.sync()

        for (let i = 0; i < ticks; i++) {
            this.addClientCommand(this.getClient(this.clientId), this.tick, this._tickCommands)
            if (this.execute(this.tick)) {
                this.tick++
            } else {
                break
            }
        }

        this._tickCommands = []

        this.sendData()
    }

    sync() {
        if (!this.savedState) return
        this.setState(this.savedState)
        for (let tick = this.savedStateTick + 1; tick < this.tick; tick++) this.execute(tick)
    }

    execute(tick) {
        if (!this.hasCommands(Math.max(tick - this.delay - this.rollback, 0))) return

        this.step(this.getCommands(tick - this.delay))

        if (this.hasCommands(tick - this.delay)) {
            this.savedStateTick = tick - this.delay
            this.savedState = this.getState()
            this.addChecksum(this.clientId, this.savedStateTick, this.checksum())
        }

        return true
    }

    //COMMANDS
    hasCommands(tick) {
        return this.clients.every(client => client.commands[tick] != null)
    }

    getCommands(tick) {
        return this.clients.map(client => ({ ...client, command: client.commands[tick] ?? client.commands.at(-1) }))
    }

    addCommand(command) {
        this._tickCommands.push(command)
    }

    addClientCommand(client, tick, commands) {
        if (tick < 0) return false
        if (!client) return false
        if (client.commands[tick]) return false
        client.commands[tick] = commands
        return true
    }

    //CLIENT
    isServer() {
        return this.clientId != null && this.clientId == this.serverId
    }

    getClient(id) {
        return this.clients.find(client => client.id == id)
    }

    getPeerClient(peerId) {
        return this.clients.find(client => client.peerId == peerId)
    }

    addClient(data) {
        const client = {
            id: -1,
            timestamp: -1,
            tick: -1,
            ping: 0,
            commands: [],
            checksums: [],
            ...data,
        }
        this.clients.push(client)

        return client
    }

    removeClient(client) {
        if (client && client.peerId) this.close(client.peerId)
        this.clients = this.clients.filter(c => c.id == client.id)
    }

    closePeer(peerId) {
        const client = this.getPeerClient(peerId)
        client.peerId = null
        if (client) this.removeClient(client)
    }

    // DATA
    sendData() {
        this.clients.filter(client => client.peerId != null).forEach(client => this.sendTo(client.peerId, this.getData(client)))
    }

    getData(client) {
        let clients = this.isServer() ? this.clients : [this.getClient(this.clientId)]

        let data = [
            this.clientId,
            this.tick,
            this.liteNow(),
            client.timestamp + (client.arrivedTimestamp ? Date.now() - client.arrivedTimestamp : 0),
            clients.length,
        ]

        let commands = []

        const startingTick = Math.max(client.tick - this.rollback - this.delay, 0)

        clients.forEach(cli => {
            let checksumValue = 0
            const checksumIndex = cli.checksums.length - 1
            if (checksumIndex >= 0) checksumValue = cli.checksums[checksumIndex]
            let command = [cli.id, checksumIndex, checksumValue, cli.commands.length - startingTick]
            for (let i = startingTick; i < cli.commands.length; i++) {
                command = [...command, i, cli.commands[i].length]
                for (let cmd of cli.commands[i]) command = [...command, cmd.length, ...cmd]
            }
            commands = [...commands, ...command]
        })

        return new Float32Array([...data, ...commands])
    }

    onData(peerId, data) {
        data = Array.from(new Float32Array(data))

        const [remoteId, remoteTick, remoteTimestamp, localTimestamp, nbClients] = data

        const client = this.getClient(remoteId)

        if (client.timestamp >= remoteTimestamp) return

        client.peerId = peerId
        client.tick = remoteTick
        client.timestamp = remoteTimestamp
        client.arrivedTimestamp = Date.now()

        if (!this.isServer() && !this.hasStarted() && remoteTick > -1) this.start()

        if (localTimestamp > 0) {
            const dt = this.liteNow() - localTimestamp
            client.ping = client.ping * 0.9 + dt * 0.1
        }

        data = data.slice(5)

        //COMMANDS
        for (let i = 0; i < nbClients; i++) {
            const [clientId, checksumTick, checksum, nbCommands] = data

            if (checksumTick >= 0) this.addChecksum(clientId, checksumTick, checksum)

            const commandClient = this.getClient(clientId)
            data = data.slice(4)

            for (let j = 0; j < nbCommands; j++) {
                const [commandTick, commandLength] = data
                data = data.slice(2)

                const cmds = []
                for (let a = 0; a < commandLength; a++) {
                    cmds.push(data.slice(1, data[0] + 1))
                    data = data.slice(data[0] + 1)
                }
                this.addClientCommand(commandClient, commandTick, cmds)
            }
        }
    }

    liteNow() {
        if (!this.startingTimestamp) this.startingTimestamp = Date.now()
        return Date.now() - this.startingTimestamp
    }

    addChecksum(clientId, tick, value) {
        const client = this.getClient(clientId)
        if (!client) return
        client.checksums[tick] = value
    }

    isSync(delta = 0) {
        for (let i = 0; i < this.clients.length; i++) {
            for (let j = i + 1; j < this.clients.length; j++) {
                for (let k = this.clients[i].checksums.length; k >= 0; k--) {
                    const value1 = this.clients[i].checksums[k]
                    const value2 = this.clients[j].checksums[k]

                    if (value2 == undefined) continue

                    if (Math.abs(value1 - value2) > delta) return false
                }
            }
        }

        return true
    }
}
