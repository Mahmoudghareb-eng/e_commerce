const crypto = require("crypto");

const hashRefreashToken = (token) => {
    return crypto
            .createHmac("sha256", process.env.REFRESH_TOKEN_HASH_SECRET)
            .update(token)
            .digest("hex");    
}

module.exports = hashRefreashToken;