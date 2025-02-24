const { createServer } = require("https")
const { parse } = require("url")
const next = require("next")
const fs = require("fs")
const path = require("path")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || path.join(process.cwd(), "server.key")),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || path.join(process.cwd(), "server.crt")),
}

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(process.env.PORT || 3000, "0.0.0.0", (err) => {
    if (err) throw err
    console.log(`> Ready on https://0.0.0.0:${process.env.PORT || 3000}`)
  })
})