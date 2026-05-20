const { execSync } = require("child_process");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

if (!fs.existsSync(".next/BUILD_ID")) {
  console.log("> Running next build...");
  execSync("npx next build", { stdio: "inherit" });
  console.log("> Build complete, starting server...");
}

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