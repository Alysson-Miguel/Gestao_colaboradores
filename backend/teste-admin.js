const bcrypt = require("bcrypt");

const hashedPassword = "$2a$10$B9TjLMVZMEhnzItrIDlUDOowPiHYfi63uI0j5gn4W3oC35gms8ybS"; // senha do admin do seed
const plainPassword = "admin123";

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) throw err;
  console.log("Senha válida?", result); // deve imprimir: true
});
