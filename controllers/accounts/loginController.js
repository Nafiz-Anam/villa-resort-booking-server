const userModel = require("../../models/accounts/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("./token-helper");
const { validationResult } = require("express-validator");
const validateUser = require("../../middleware/user-validater");
const { sendSms } = require("../../lib/sms-helper");
const { OAuth2Client } = require("google-auth-library");
const { sendRegisterMail } = require("../../lib/registerMail");

const client = new OAuth2Client(
    "895140950896-rabmousqitle4tmbpnjkd7o1g71to39m.apps.googleusercontent.com"
);
var obj = {
    status: false,
    message: "",
    data: [],
};
module.exports.login = async (req, res) => {
    var a = validationResult(req);
    if (!a.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }
    var data = req.body;
    if (data.email == null) {
        obj.message = "email is required";
        return res.json(obj);
    } else if (data.password == null) {
        obj.message = "password is required";
        return res.json(obj);
    } else if (data.fcm_token == null) {
        obj.message = "Fcm token is required";
        return res.json(obj);
    } else {
        var user = await userModel.findOne({
            email: data.email,
            user_type: data.user_type,
            is_active: true,
        });
        if (user == null) {
            return res.json({
                status: false,
                message: "user not found",
                data: [],
            });
        }
        let check = bcrypt.compareSync(data.password, user.password);
        if (check) {
            let token = generateAccessToken(
                user.mobile_no,
                user._id,
                user.name,
                user.email
            );

            var user = await userModel.findOneAndUpdate(
                { email: user.email },
                { $set: { token: token, fcm_token: data.fcm_token } },
                { new: true }
            );
            // var user = await userModel.findOneAndUpdate({email:user.email},{$set:{token:token}},{new:true})
            return res.json({
                status: true,
                message: "User Login Successfully",
                data: user,
            });
        } else {
            return res.json({
                status: false,
                message: "email or password Incorrect",
                data: [],
            });
        }
    }
};

module.exports.loginWithFacebook = async (req, res) => {
    let data = req.body;
    if (!data.email) {
        return res.json({
            status: false,
            message: "Your Mail Id should be registered with facebook",
            data: [],
        });
    }
    try {
        let userdata = {};
        userdata["email"] = data.email;
        userdata["name"] = data.name;
        userdata["facebook_id"] = data.id;
        userdata["user_type"] = "user";
        userdata["signup_method"] = "facebook";

        let user = await userModel.findOne({
            email: userdata.email,
            user_type: userdata.user_type,
        });
        if (user) {
            if (user.is_active == false) {
                return res.json({
                    status: false,
                    message: "Admin has inactive this  account",
                    data: [],
                });
            }
            let token = await generateAccessToken(
                user._id,
                user.name,
                user.email,
                user.mobile_no
            );
            let userUpdate = await userModel.findOneAndUpdate(
                { _id: user._id },
                { $set: { token: token } },
                { new: true }
            );

            return res.json({
                status: true,
                message: "User is LoggedIn successfully",
                data: userUpdate,
            });
        } else {
            let saveUser = new userModel(userdata);
            await saveUser.save(async (err, result) => {
                if (!err) {
                    let token = await generateAccessToken(
                        result._id,
                        result.name,
                        result.email,
                        result.mobile_no
                    );
                    let userUpdate = await userModel.findOneAndUpdate(
                        { _id: result._id },
                        { $set: { token: token } },
                        { new: true }
                    );
                    return res.json({
                        status: true,
                        message: "User logged in successfully",
                        data: userUpdate,
                    });
                } else {
                    return res.json({
                        status: false,
                        message: err.message,
                        data: [],
                    });
                }
            });
        }
    } catch {
        return res.json({
            status: false,
            message: "Something went wrong",
            data: [],
        });
    }
};

module.exports.loginWithGoogle = async (req, res) => {
    let data = req.body;
    console.log(req.body);
    let userdata = {};
    data["user_type"] = "user";
    try {
        let response = await client.verifyIdToken({
            idToken: data.tokenId,
            audience:
                "895140950896-rabmousqitle4tmbpnjkd7o1g71to39m.apps.googleusercontent.com",
        });
        userdata["email"] = response.payload.email;
        userdata["name"] = response.payload.name;
        userdata["email_verify"] = response.payload.email_verified;
        userdata["google_id"] = response.payload.sub;
        userdata["signup_method"] = "google";
        userdata["user_type"] = "user";

        let user = await userModel.findOne({
            email: userdata.email,
            user_type: userdata.user_type,
        });
        if (user) {
            if (user.is_active == false) {
                return res.json({
                    status: false,
                    message: "Admin has inactive this  account",
                    data: [],
                });
            }
            let token = await generateAccessToken(
                user._id,
                user.name,
                user.email,
                user.mobile_no,
            );
            let userUpdate = await userModel.findOneAndUpdate(
                { _id: user._id },
                { $set: { token: token } },
                { new: true }
            );

            return res.json({
                status: true,
                message: "User is LoggedIn successfully",
                data: userUpdate,
            });
        } else {
            let saveUser = new userModel(userdata);
            await saveUser.save(async (err, result) => {
                if (!err) {
                    let token = await generateAccessToken(
                        result._id,
                        result.name,
                        result.email,
                        result.mobile_no,
                    );
                    let userUpdate = await userModel.findOneAndUpdate(
                        { _id: result._id },
                        { $set: { token: token } },
                        { new: true }
                    );
                    return res.json({
                        status: true,
                        message: "User logged in successfully",
                        data: userUpdate,
                    });
                } else {
                    return res.json({
                        status: false,
                        message: err.message,
                        data: [],
                    });
                }
            });
        }
    } catch {
        return res.json({
            status: false,
            message: "Something went wrong",
            data: [],
        });
    }
};

module.exports.logoutUser = async (req, res) => {
    email = req.user.email;
    let lData = await userModel.findOneAndUpdate(
        { email: email },
        { $set: { token: "1" } },
        { new: true }
    );
    if (lData) {
        return res.json({
            status: true,
            message: "user logged out successfully",
            data: [],
        });
    } else {
        return res.json({
            status: false,
            message: "User not found",
            data: [],
        });
    }
};

// modified
module.exports.sendOtp = async (req, res) => {
    var email_address = req.body.email_address;
    const data = {};
    data.email = req.body.email_address;
    var a = validationResult(req);
    if (!a.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }
    // console.log("login with email_address", email_address);
    // console.log("login with otp", data);

    let findEmail = await userModel.findOne({
        email: email_address,
        is_active: true,
    });

    // console.log("findEmail", findEmail);

    if (!findEmail) {
        console.log("email not found");
        var otp = await sendRegisterMail(req, res, email_address, "New User");

        data["mobile_otp"] = otp;
        data["user_type"] = "user";

        let createUser = new userModel(data);

        await createUser.save((err, result) => {
            console.log("create user res =>", result);
            console.log("create user err =>", err);
            if (!err) {
                return res.json({
                    status: true,
                    message: "Otp is Sent Successfully",
                    data: result,
                });
            }
        });
    } else {
        var otp = await sendRegisterMail(
            req,
            res,
            email_address,
            findEmail?.name
        );

        if (otp) {
            var otpData = await userModel.findOneAndUpdate(
                { email: email_address },
                { $set: { mobile_otp: otp } },
                { new: true }
            );
            return res.json({
                status: true,
                message: "Otp is Sent Successfully",
                data: otpData,
            });
        } else {
            return res.json({
                status: false,
                message: "Something Went Wrong",
                data: [],
            });
        }
    }
};

// module.exports.sendOtp = async (req, res) => {
//     var mobile_no = req.body.mobile_no;
//     const data = req.body;
//     var a = validationResult(req);
//     if (!a.isEmpty()) {
//         return res.json({
//             status: false,
//             message: a.array()[0].msg,
//             data: [],
//         });
//     }
//     console.log("login with otp", data);
//     let findMobile = await userModel.findOne({
//         mobile_no: mobile_no,
//         is_active: true,
//     });
//     if (!findMobile) {
//         console.log("mobile no not found");
//         var otp = await sendSms(mobile_no, "");
//         data["mobile_otp"] = otp;
//         data["user_type"] = "user";

//         let createUser = new userModel(data);
//         await createUser.save((err, result) => {
//             console.log(result);
//             console.log(err);
//             if (!err) {
//                 return res.json({
//                     status: true,
//                     message: "Otp is Sent Successfully",
//                     data: result,
//                 });
//             }
//         });
//     }
//     // var otp = await sendSms(mobile_no,findMobile.name)
//     else {
//         var otp = await sendSms(mobile_no, findMobile.name);

//         if (otp) {
//             var otpData = await userModel.findOneAndUpdate(
//                 { mobile_no: mobile_no },
//                 { $set: { mobile_otp: otp } },
//                 { new: true }
//             );
//             return res.json({
//                 status: true,
//                 message: "Otp is Sent Successfully",
//                 data: otpData,
//             });
//         } else {
//             return res.json({
//                 status: false,
//                 message: "Something Went Wrong",
//                 data: [],
//             });
//         }
//     }
// };

module.exports.loginWithOtp = async (req, res) => {
    var data = req.body;
    var a = validationResult(req);
    if (!a.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }
    console.log("data =>", data);
    let query = {
        $gt: new Date().getTime() - 1000 * 60 * 10,
    };

    let userData = await userModel.findOne({
        email: data.email_address,
        user_type: "user",
        is_active: true,
        // updatedAt: query,
    });
    console.log("userData =>", userData);
    let isotpcorrect = await userModel.findOne({
        email: data.email_address,
        mobile_otp: data.otp,
        user_type: "user",
        is_active: true,
    });

    if (!userData) {
        return res.json({
            status: false,
            message: "Otp is expire",
            data: [],
        });
    } else if (!isotpcorrect) {
        return res.json({
            status: false,
            message: "Otp is incorrect",
            data: [],
        });
    } else {
        // { id: id, name: name, email: email, mobile_no: mobile_no },
        let token = generateAccessToken(
            userData._id,
            userData.name,
            userData.email,
            userData.mobile_no
        );
        console.log("login with opt token =>", token);

        var user = await userModel.findOneAndUpdate(
            { email: userData.email },
            { $set: { token: token } },
            { new: true }
        );
        console.log("login with opt =>", user);

        return res.json({
            status: true,
            message: "User is LoggedIn successfully",
            data: user,
        });
    }
};

module.exports.isUserLoggedIn = async (req, res) => {
    return res.json({
        status: true,
        message: "User is Logged",
        data: [],
    });
};
