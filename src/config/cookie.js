const refreshCookieOptions = {
    httpOnly:true,
    secure:true,
    sameSite:"Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const clearRefreshCookieOptions = {
    httpOnly:true,
    secure:true,
    sameSite:"Strict"
};
module.exports = {
    refreshCookieOptions,
    clearRefreshCookieOptions
};