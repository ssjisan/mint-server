const bcrypt = require("bcrypt");

const password = "jis@121212";

const hash = bcrypt.hashSync(password, 12);

console.log(hash);
