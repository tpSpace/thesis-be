const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || 30 * 24 * 60;

const JWT_EXPIRY = process.env.JWT_EXPIRY || 15;

const verifyUser = (currentID, claimedID) => {
    return currentID == claimedID
}

const verifyRole = (reqRoleId, tarRoleId) => {
    return reqRoleId == tarRoleId;
}

module.exports = {
    REFRESH_TOKEN_EXPIRY,
    JWT_EXPIRY,
    verifyUser,
    verifyRole
};