const jwt = require("jsonwebtoken");
const { env } = require("../../config/config");

const generateAccessToken = (id, name, email, mobile_no) => {
    return jwt.sign(
        { id: id, name: name, email: email, mobile_no: mobile_no },
        env.secrete,
        { expiresIn: env.token_expire }
    );
};

module.exports = generateAccessToken;
