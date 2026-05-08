const { execSync } = require("child_process");
const { createServer } = require("http");
const next = require("next");
const fs = require("fs");

const port = process.env.PORT || 8080;
const hostname = "0.0.0.0";

if (!fs.existsSync(".next")) {
  console.log("Build não encontrado. Rodando npm run build...");
  execSync("npm run build", {
    stdio: "inherit",
  });
}

const app = next({
  dev: false,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, hostname, () => {
    console.log(`Painel rodando em http://${hostname}:${port}`);
  });
});