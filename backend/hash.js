const bcrypt = require("bcrypt");

async function gerar() {
  const senha = "12332144";
  const hash = await bcrypt.hash(senha, 10);
  console.log("HASH:", hash);
}

gerar();
