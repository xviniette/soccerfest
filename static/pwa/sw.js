self.addEventListener("install", event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open("mycache")
        })()
    )
})

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(r => {
            console.log("[Service Worker] Récupération de la ressource: " + e.request.url)
            return (
                r ||
                fetch(e.request).then(response => {
                    return caches.open(cacheName).then(cache => {
                        console.log("[Service Worker] Mise en cache de la nouvelle ressource: " + e.request.url)
                        cache.put(e.request, response.clone())
                        return response
                    })
                })
            )
        })
    )
})
