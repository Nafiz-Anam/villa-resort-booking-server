const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
    {
        email: { type: String, lowercase: true, default: "" },
        // email: { type: String, lowercase: true },
        // password:{type:String,required: [true, "can't be blank"]},
        name: {
            type: String,
            default: "",
        },
        mobile_no: { type: String, lowercase: true, default: "" },
        optional_mobile_no: { type: String },
        image: String,
        token: String,
        signup_method: String,
        google_id: String,
        facebook_id: String,
        mobile_otp: String,
        device_id: String,
        device_type: String,
        fcm_token: String,
        user_type: String,
        password: String,
        address: String,
        email_verify: {
            type: Boolean,
            default: false,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

userSchema.plugin(uniqueValidator, { message: "is already taken." });
const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
