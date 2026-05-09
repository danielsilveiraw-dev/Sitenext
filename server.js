const { execSync } = require('child_process')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

if (!fs.existsSync('.next/BUILD_ID')) {
  console.log('> Building...')
  execSync('npm run build', { stdio: 'inherit' })
  console.log('> Build completo!')
} else {
  console.log('> Build já existe, pulando...')
}

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