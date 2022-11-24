const { sendSms } = require("../../lib/sms-helper");
const { sendmail } = require("../../lib/mail-helper");

const { validationResult } = require("express-validator");

const otpModel = require("../../models/accounts/otpModel");
const generateAccessToken = require("./token-helper");
const userModel = require("../../models/accounts/userModel");
const { sendRegisterMail } = require("../../lib/registerMail");

module.exports.sendOtp = async (req, res) => {
    var a = validationResult(req);
    console.log(req.body);
    if (!a.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }

    var data = req.body;
    console.log(data);
    var mobile_no = req.body.mobile_no;
    let email = req.body.email;
    let name = req.body.name;
    let isMobileExist = await userModel.findOne({ mobile_no: mobile_no });
    if (isMobileExist) {
        return res.json({
            status: false,
            message: "Mobile number already register",
            data: [],
        });
    }
    let isEmailExist = await userModel.findOne({ email: email });
    if (isEmailExist) {
        return res.json({
            status: false,
            message: "Email Already Exist",
            data: [],
        });
    }

    var otp = await sendRegisterMail(req, res, email, name);
    // var otp = await sendSms(mobile_no, name);
    // var otp = 1111;

    data["mobile_otp"] = otp;
    var d = await otpModel.updateOne({ mobile_no: mobile_no }, data, {
        upsert: true,
        setDefaultsOnInsert: true,
    });
    return res.json({
        status: true,
        message: "Otp is sent successfully",
        data: {
            otp: 1111,
        },
    });
};
