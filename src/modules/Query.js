export default {
    get() {
        const queries = {}
        const query = new URLSearchParams(window.location.search)

        for (let key of query.keys()) {
            if (query.has(key)) queries[key] = query.get(key)
        }

        return queries
    },
    set(params) {
        const parameters = []
        for (let attr in params) parameters.push(`${attr}=${encodeURI(params[attr])}`)

        history.replaceState(null, "", `${window.location.href.split("?")[0]}?${parameters.join("&")}`)
    },
    delete(param) {
        const query = new URLSearchParams(window.location.search)
        query.delete(param)

        history.replaceState(null, "", `${window.location.href.split("?")[0]}?${[...query.entries()].map(data => `${data[0]}=${data[1]}`).join("&")}`)
    },
}
