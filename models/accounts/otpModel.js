const mongoose = require('mongoose')

var otpSchema = new mongoose.Schema({
    mobile_otp:String,
    mobile_no: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], index: true},
},{timestamps:true})

var otpModel = mongoose.model('otp',otpSchema)
module.exports = otpModel