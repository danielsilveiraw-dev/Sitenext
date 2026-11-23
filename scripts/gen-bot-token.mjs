import { randomBytes, createHash } from "crypto";

const botId = process.argv[2];
if (!botId) {
  console.log("Uso: node scripts/gen-bot-token.mjs ID_DO_BOT");
  process.exit(1);
}

const token = randomBytes(32).toString("hex");
const hash = createHash("sha256").update(token).digest("hex");

console.log("\n1) Coloque no .env do BOT (guarde, ele não aparece de novo):");
console.log(`BOT_API_TOKEN=${token}`);
console.log("\n2) Rode no SQL Editor do Supabase:");
console.log(`update "Bot" set "apiTokenHash" = '${hash}' where id = '${botId}';\n`);