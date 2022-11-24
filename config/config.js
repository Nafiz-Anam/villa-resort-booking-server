require("dotenv").config();
module.exports.env = {
    mongoURL: process.env.LOCAL_MONGO_URL,
    secrete: process.env.SECRETE,
    token_expire: process.env.TOKEN_EXPIRE,
    port: process.env.PORT,
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_SECRET: process.env.RAZORPAY_SECRET,
    server_url: process.env.LOCAL_URL,
};
