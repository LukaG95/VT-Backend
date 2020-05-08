const crypto = require('crypto');
const bcrypt = require('bcrypt');


// 1) Create random token
// 2) Hash token with bcrypt and later save in db
// 3) Send the user 'random token'
let hashedToken;

const createToken = async function () {
    const emailToken = crypto.randomBytes(32).toString('hex');

    hashedToken = await bcrypt.hash(emailToken, 8);
    console.log(hashedToken);
    return emailToken;
};


const asyncFunc = async () => {
    const token = await createToken();
    console.log('Hey!');
    console.log(token);
    console.log(await bcrypt.compare(token, hashedToken));
};


asyncFunc();




sendEmail on signup

verifyToken

sendAgain
verifyToken