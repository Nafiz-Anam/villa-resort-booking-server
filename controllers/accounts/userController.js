const userModel = require("../../models/accounts/userModel");
const bcrypt = require("bcrypt");
const generateAccessToken = require("./token-helper");
const { validationResult } = require("express-validator");
const { sendSms } = require("../../lib/sms-helper");
const { sendmail } = require("../../lib/mail-helper");

const otpModel = require("../../models/accounts/otpModel");

var obj = {
    status: false,
    message: "",
    data: [],
};

module.exports.createUser = async (req, res) => {
    let data = req.body;
    var a = validationResult(req);

    if (!a.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    } else {
        saveUser(req, res);
    }
};

const saveUser = async (req, res) => {
    let data = req.body;

    // let p = data.password

    // if (p) {
    //     const hash = bcrypt.hashSync(p, 10);
    //     data.password = hash
    // }
    // else {
    //     obj.status = false
    //     obj.message = "password is required"
    //     return res.json(obj)
    // }
    let query = {
        $gt: new Date().getTime() - 1000 * 60 * 5,
    };
    console.log("query =>", query);
    let userOTP = await otpModel.findOne({
        mobile_no: data.mobile_no,
        updatedAt: query,
    });
    let isotpcorrect = await otpModel.findOne({
        mobile_no: data.mobile_no,
        mobile_otp: data.mobile_otp,
    });

    if (!userOTP) {
        return res.json({
            status: false,
            message: "Otp is expire ",
            data: [],
        });
    }
    if (!isotpcorrect) {
        return res.json({
            status: false,
            message: "Otp is incorrect",
            data: [],
        });
    }
    // var otpMatch = await otpModel.findOne({mobile_no:data.mobile_no,mobile_otp:data.mobile_otp})
    // if(!otpMatch){
    //     return res.json({
    //         "status":false,
    //         "message":"Otp is not match",
    //         "data":[]

    //     })
    // }
    data["user_type"] = "user";
    let userData = new userModel(data);

    await userData.save(async (err, result) => {
        if (!err) {
            let token = await generateAccessToken(
                result.mobile_no,
                result._id,
                result.name,
                result.email
            );
            let uData = await userModel.findOneAndUpdate(
                { _id: result._id },
                { $set: { token: token } },
                { new: true }
            );
            obj.status = true;
            obj.message = "User created successfully";
            obj.data = uData;
            return res.json(obj);
        } else {
            obj.status = false;
            obj.message = err.message;
            return res.json(obj);
        }
    });
};

const updateUser = async (req, res) => {
    let data = req.body;
    let p = data.password;
    if (p) {
        const hash = bcrypt.hashSync(p, 10);
        data.password = hash;
    } else {
        obj.status = false;
        obj.message = "password is required";
        return res.json(obj);
    }
    userModel
        .findOneAndUpdate({ _id: data._id }, data, { new: true })
        .then((result) => {
            if (result) {
                return res.json({
                    status: true,
                    message: "user is updated successfully",
                    data: result,
                });
            } else {
                return res.json({
                    status: false,
                    message: "user not found",
                    data: [],
                });
            }
        })
        .catch((error) => {
            var obj = Object.keys(error.keyValue);
            return res.json({
                status: false,
                message: obj[0] + " is already exist",
                data: [],
            });
        });
};

module.exports.updateProfile = async (req, res) => {
    var id = req.body.id;
    let data = req.body;
    var a = validationResult(req);

    if (!a.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }

    if (id == null) {
        obj.status = false;
        obj.message = "User id is required";
        return res.json(obj);
    } else {
        let isEmailExist = await userModel.findOne({
            email: data.email,
            _id: { $ne: data.id },
        });
        let isMobileExist = await userModel.findOne({
            mobile_no: data.mobile_no,
            _id: { $ne: data.id },
        });

        if (isEmailExist) {
            return res.json({
                status: false,
                message: "Email is already exist",
                data: [],
            });
        } else if (isMobileExist) {
            return res.json({
                status: false,
                message: "Mobile number is already exist",
                data: [],
            });
        } else {
            let updatedData = await userModel.findOneAndUpdate(
                { _id: data.id },
                data,
                { new: true }
            );
            if (updatedData) {
                return res.json({
                    status: true,
                    message: "Detailed updated successfully",
                    data: updatedData,
                });
            } else {
                return res.json({
                    status: false,
                    message: "User not found",
                    data: [],
                });
            }
        }
    }
};

module.exports.getDetail = async (req, res) => {
    var id = req.body.id;
    if (id == null) {
        obj.status = false;
        obj.message = "User id is required";
        return res.json(obj);
    }
    let uData = await userModel.findOne({ _id: id });
    if (uData) {
        obj.status = true;
        obj.message = "User detailed succesfully";
        obj.data = uData;
        return res.json(obj);
    } else {
        obj.status = false;
        obj.message = "User Not found";
        return res.json(obj);
    }
};

module.exports.deleteUser = async (req, res) => {
    var id = req.data.id;
    let data = req.data;
    if (id == null) {
        obj.status = false;
        obj.message = "User id is required";
        return res.json(obj);
    } else {
        let uData = userModel.findOneAndUpdate(
            { _id: id },
            { $set: { is_deleted: true, is_active: false } },
            { new: true }
        );
        if (uData) {
            obj.status = true;
            obj.message = "User deleted succesfully";
            obj.data = uData;
            return res.json(obj);
        } else {
            obj.status = false;
            obj.message = "User Not found";

            return res.json(obj);
        }
    }
};

module.exports.getAllUser = async (req, res) => {
    let uData = await userModel.find();
    return res.json({
        status: true,
        message: "user listed succesfully",
        data: uData,
    });
};

module.exports.sendVerifyEmail = async (req, res) => {
    email = req.body.email;
    var user = await userModel.findOne({ email: email });
    if (user) {
        let message =
            "http://" + req.headers.host + "/accounts/verify/" + user._id;

        sendmail(req, res, message, email);
    } else {
        return res.json({
            status: true,
            message: "Email is not found",
            data: [],
        });
    }
};

module.exports.verifyEmail = async (req, res) => {
    var id = req.params.id;
    var user = await userModel.findOneAndUpdate(
        { _id: id },
        { $set: { email_verify: true } },
        { new: true }
    );
    if (user) {
        return res.json({
            status: true,
            message: "Email is verified",
            data: [],
        });
    } else {
        return res.json({
            status: false,
            message: "Please check email verification link is correct",
            data: [],
        });
    }
};

// module.exports.changePassword = async(req,res) =>{
//     let data = req.body
//     if(data.old_password==null){
//         obj.message="old password is required"
//         return res.json(obj)
//     }
//     else if(data.new_password==null){
//         obj.message="new password is required"
//         return res.json(obj)
//     }
//     else {
//         let id=req.user.id
//         let user = await userModel.findOne({_id:id})
//         if(user) {
//             let check = bcrypt.compareSync(data.old_password,user.password)
//             if(check){
//                 let p = bcrypt.hashSync(data.new_password,10)
//                 let uData= await userModel.findOneAndUpdate({_id:id},{$set:{password:p}},{new:true})
//                 return res.json({
//                     "status":true,
//                     "message":"Password is updated",
//                     "data":uData
//                 })
//             }
//             else {
//                 return res.json({
//                     "status":false,
//                     "message":"Old password is incorrect",
//                     "data":[]
//                 })
//             }
//         }
//         else {
//             return res.json({
//                 "status":false,
//                 "message":"User not found",
//                 "data":[]
//             })
//         }

//     }
// }
