const { execSync } = require('child_process')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

console.log('> Building...')
execSync('npm run build', { stdio: 'inherit' })
console.log('> Build completo!')

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(8080, '0.0.0.0', () => {
    console.log('> Ready on http://0.0.0.0:8080')
  })
})