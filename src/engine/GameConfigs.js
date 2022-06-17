export default {
    player: {
        radius: 0.5,
        gravity: {
            x: 0,
            y: 0.013,
        },
        bounce: {
            x: 0,
            y: 0,
        },
        speed: 0.13,
        jump: -0.47,
        bombImpulsion: -0.15,
        normalFriction: {
            x: 0.3,
            y: 0.93,
        },
        normalBounce: {
            x: 0,
            y: 0,
        },
        stunFriction: {
            x: 0.96,
            y: 0.9,
        },
        stunBounce: {
            x: 0.9,
            y: 0.9,
        },
        deltaAction: 12,
    },
    ball: {
        radius: 0.5,
        gravity: {
            x: 0,
            y: 0.013,
        },
        friction: {
            x: 0.965,
            y: 0.93,
        },
        bounce: {
            x: 0.9,
            y: 0.7,
        },
        maxspeed: 1.5,
        kick: {
            x: 0.27,
            y: -0.185,
        },
        up: {
            x: 0.03,
            y: -0.475,
            boost: 5,
        },
        respawnTime: 240,
    },
    bomb: {
        radius: 0.45,
        gravity: {
            x: 0,
            y: 0.013,
        },
        friction: {
            x: 0.965,
            y: 0.93,
        },
        bounce: {
            x: 0,
            y: 0.66,
        },
        maxspeed: 1.5,
        kick: {
            x: 0.225,
            y: -0.185,
        },
        bigKick: {
            x: 0.46,
            y: -0.37,
        },
        up: {
            x: 0.03,
            y: -0.46,
            boost: 5,
        },
        jumpCreation: {
            x: 0.225,
            y: -0.185,
        },
        explosionTime: 75,
        bigExplosionTime: 36,
        explosionRadius: 2.75,
        bigExplosionRadius: 4.5,
        explosionBall: {
            min: 0.1,
            max: 0.8,
        },
        explosionPlayer: {
            min: 0.05,
            max: 0.4,
        },
        timestun: {
            min: 52,
            max: 92,
        },
    },
}
