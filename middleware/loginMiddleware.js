const jwt = require("jsonwebtoken");
const userModel = require("../models/accounts/userModel");
const { env } = require("../config/config");

const loginmiddleware = async (req, res, next) => {
    var t = req.headers.authorization;

    if (t == null) {
        return res.json({
            status: false,
            message: "Token is required",
            data: [],
        });
    } else {
        jwt.verify(t, env.secrete, (err, decode) => {
            if (err) {
                return res.json({
                    status: false,
                    message: "Token is expire",
                    data: [],
                });
            }
            // console.log(err)
            req.user = decode;
            console.log("user", decode);
        });

        if (req.user) {
            userModel
                .findOne({ email: req.user.email, token: t })
                .then((result) => {
                    if (result) {
                        next();
                    } else {
                        return res.json({
                            status: false,
                            message: "Token expire user nai",
                            data: [],
                        });
                    }
                });
        }
    }
};

module.exports = loginmiddleware;
