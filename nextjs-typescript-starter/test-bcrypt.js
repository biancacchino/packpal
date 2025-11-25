const { genSaltSync, hashSync } = require('bcrypt-ts');
console.log('bcrypt-ts loaded');
const salt = genSaltSync(10);
const hash = hashSync('password', salt);
console.log('Hash:', hash);
