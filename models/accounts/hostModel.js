const mongoose = require("mongoose")
var uniqueValidator = require('mongoose-unique-validator');

var hostSchema = new mongoose.Schema({
    host_name:String,
    host_email:{type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
    host_contact_no:{type: String, lowercase: true, unique: true, required: [true, "can't be blank"], index: true},
    villa:String,
    device_id:String,
    token:String,
    email_verify:{
        type:Boolean,
        default:false
      },
  mobile_otp:String,

    is_active:{
        type:Boolean,
        default:true
    },
    is_deleted:{
        type:Boolean,
        default:false
    },
    device_type:String,
    device_id:String,
    fcm_token:String
},{timestamps:true})


hostSchema.plugin(uniqueValidator, {message: 'is already taken.'});
const hostModel = mongoose.model('host', hostSchema);
module.exports= hostModel;