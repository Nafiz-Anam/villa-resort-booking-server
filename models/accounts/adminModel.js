const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            lowercase: true,
            unique: true,
            required: [true, "can't be blank"],
            match: [/\S+@\S+\.\S+/, "is invalid"],
            index: true,
        },
        password: String,
        token: String,
    },
    { timestamps: true }
);

const adminModel = mongoose.model("admin", adminSchema);
module.exports = adminModel;
