const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = process.env.PORT || 8080;

const app = next({
  dev: false,
  hostname: "0.0.0.0",
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});