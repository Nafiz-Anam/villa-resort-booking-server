var mongoose = require("mongoose");

var notifySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        title: String,
        body: String,
        Date: {
            type: Date,
            default: Date.now,
        },
        fcmtoken: String,
    },
    {
        timestamps: true,
    }
);

const notifyModel = mongoose.model("notification", notifySchema);
module.exports = notifyModel;
