const merge = (x, y) => {
    for (let i in y) {
        if (x[i] == undefined || typeof x[i] !== "object") {
            x[i] = y[i]
        } else {
            merge(x[i], y[i])
        }
    }
}

export default merge
