import animations from "../data/animations.js"

const calMapData = map => {
    const tiles = []

    for (let x = 0; x < map.tiles.length; x++) {
        tiles[x] = []
        for (let y = map.tiles[x].length - 1; y >= 0; y--) {
            if (map.isTile(x - 1, y) || map.isTile(x + 1, y)) {
                if (map.isTile(x - 1, y)) {
                    tiles[x][y] = {
                        direction: "h",
                        index: tiles[x - 1][y].index + 1,
                    }
                } else {
                    tiles[x][y] = { direction: "h", index: 0 }
                }
            } else if (map.isTile(x, y - 1) || map.isTile(x, y + 1)) {
                if (map.isTile(x, y + 1)) {
                    tiles[x][y] = {
                        direction: "v",
                        index: tiles[x][y + 1].index + 1,
                    }
                } else {
                    tiles[x][y] = { direction: "v", index: 0 }
                }
            } else {
                tiles[x][y] = { direction: "h", index: 0 }
            }
        }
    }

    return tiles
}

const generateAnimation = (frame = {}, options = {}) => {
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

const drawSprite = (canvas, ctx, x, y, width, height, asset, animations, options = {}) => {
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

export default ({ canvas, ctx, map, assets, offset, tilesize }) => {
    const now = Date.now()

    const { width, height } = canvas

    // BACKGROUND
    const bgSize = Math.ceil(6.3 * tilesize)
    for (let i = 0; i < width / bgSize; i++) {
        for (let j = 0; j < height / bgSize; j++) {
            drawSprite(
                canvas,
                ctx,
                i * bgSize,
                j * bgSize,
                bgSize,
                bgSize,
                assets.sprite,
                generateAnimation(animations.background.frame, animations.background.animation),
                { key: 14 }
            )
        }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, width, offset.y)
    ctx.fillRect(0, offset.y + map.tiles[0].length * tilesize, width, height - (offset.y + map.tiles[0].length * tilesize))
    ctx.fillRect(0, offset.y, offset.x, map.tiles[0].length * tilesize)
    ctx.fillRect(offset.x + map.tiles.length * tilesize, offset.y, width - (offset.x + map.tiles.length * tilesize), map.tiles[0].length * tilesize)

    const mapData = calMapData(map)

    // TILES
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
    for (let x = 0; x < map.tiles.length; x++) {
        for (let y = 0; y < map.tiles[x].length; y++) {
            if (map.isTile(x, y)) {
                ctx.fillRect(offset.x + x * tilesize + tilesize * 0.15, offset.y + y * tilesize + tilesize * 0.15, tilesize, tilesize)

                const index = 0
                const tileIndex = mapData[x][y].index

                ctx.save()

                ctx.translate(offset.x + x * tilesize + tilesize / 2, offset.y + y * tilesize + tilesize / 2)

                ctx.rotate(mapData[x][y].direction == "v" ? -Math.PI / 2 : 0)

                ctx.drawImage(assets.sprite, 420 + tileIndex * 20, index * 20, 20, 20, -tilesize / 2, -tilesize / 2, tilesize, tilesize)

                ctx.restore()
            }

            if (map.isGoal(x, y)) {
                const team = map.isGoal(x, y)
                const spriteY = team == 1 ? 101 : 161

                drawSprite(
                    canvas,
                    ctx,
                    offset.x + x * tilesize,
                    offset.y + y * tilesize,
                    tilesize,
                    tilesize,
                    assets.rayon,
                    [
                        { x: 20, y: spriteY, width: 19, height: 19 },
                        { x: 40, y: spriteY, width: 19, height: 19 },
                    ],
                    { fps: 20, delta: now }
                )
            }

            if (map.tiles[x][y].type == "warp") {
                ctx.save()

                ctx.translate(offset.x + x * tilesize + tilesize / 2, offset.y + y * tilesize + tilesize / 2)

                ctx.rotate(map.tiles[x][y].v ? Math.PI / 2 : 0)

                drawSprite(
                    canvas,
                    ctx,
                    -tilesize / 2,
                    -tilesize / 2,
                    tilesize,
                    tilesize,
                    assets.rayon,
                    [
                        { x: 0, y: 0, width: 20, height: 20 },
                        { x: 0, y: 20, width: 20, height: 20 },
                        { x: 0, y: 40, width: 20, height: 20 },
                    ],
                    { fps: 10, delta: now }
                )

                ctx.restore()
            }
        }
    }
}
