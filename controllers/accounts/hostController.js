const hostModel = require("../../models/accounts/userModel");
const villaModel = require("../../models/info/villaModel");
const bookModel = require("../../models/booking/bookModel");
const generateAccessToken = require("./token-helper");
const { validationResult } = require("express-validator");
const { sendSms } = require("../../lib/sms-helper");
const { sendmail } = require("../../lib/mail-helper");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const otpModel = require("../../models/accounts/otpModel");
const { deleteData } = require("../../lib/queryHelper");

const moment = require("moment");

var obj = {
    status: false,
    message: "",
    data: [],
};

module.exports.createHost = async (req, res) => {
    var a = validationResult(req);

    if (!a.isEmpty()) {
        return res.json({ error: a.array()[0].msg });
    } else {
        saveHost(req, res);
    }
};

const saveHost = async (req, res) => {
    let data = req.body;

    // var otpMatch = await otpModel.findOne({mobile_no:data.mobile_no,mobile_otp:data.mobile_otp})
    // if(!otpMatch){
    //     return res.json({
    //         "status":false,
    //         "message":"Otp is not match",
    //         "data":[]

    //     })
    // }
    let p = data.password;
    if (p) {
        data["password"] = bcrypt.hashSync(p, 10);
    }
    let checkmobileno = await hostModel.exists({ mobile_no: data.mobile_no });
    if (checkmobileno) {
        return res.json({
            status: false,
            message: "Mobile no is already register",
            data: [],
        });
    }
    let checkemail = await hostModel.exists({ email: data.email });
    if (checkemail) {
        return res.json({
            status: false,
            message: "Email  is already register",
            data: [],
        });
    }

    let hostData = new hostModel(data);
    await hostData.save(async (err, result) => {
        if (!err) {
            let token = await generateAccessToken(result._id, result.email);
            console.log(token);
            console.log(result);

            let hData = await hostModel.findOneAndUpdate(
                { email: result.email },
                { $set: { token: token } },
                { new: true }
            );
            return res.json({
                status: true,
                message: "Host created succesfully",
                data: hData,
            });
        } else {
            return res.json({
                status: false,
                message: err.message,
                data: [],
            });
        }
    });
};

module.exports.updateHostProfile = async (req, res) => {
    var id = req.body._id;
    var data = req.body;

    data["user_type"] = "host";
    if (id == null) {
        return res.json({
            status: false,
            message: "host is is required",
            data: [],
        });
    }
    try {
        let p = data.password;
        console.log(p);
        if (p) {
            data["password"] = bcrypt.hashSync(p, 10);
        }

        let hData = await hostModel.findOneAndUpdate(
            { _id: id },
            data,
            { new: true },
            (err, result) => {
                if (err) {
                    return res.json({
                        status: false,
                        message: err,
                        data: [],
                    });
                } else {
                    return res.json({
                        status: true,
                        message: "host profile is updated successfully",
                        data: result,
                    });
                }
            }
        );
    } catch (e) {
        console.log(e);
    }
    // if(hData) {
    //     return res.json({
    //         "status":true,
    //         "message":"Host profile updated succesfully",
    //         "data":[]
    //     })
    // }
    // else {
    //     return res.json({
    //         "status":false,
    //         "message":"Host does not found",
    //         "data":[]
    //     })
    // }
};

module.exports.getHostDetail = async (req, res) => {
    var id = req.body.id;

    if (id == null) {
        return res.json({
            status: false,
            message: "host is is required",
            data: [],
        });
    }
    let hData = await hostModel.findOne({ _id: id });
    if (hData) {
        return res.json({
            status: true,
            message: "Host Detailed Successfully",
            data: hData,
        });
    } else {
        return res.json({
            status: false,
            message: "Host is not found",
            data: [],
        });
    }
};

module.exports.deleteHost = async (req, res) => {
    var id = req.body.id;
    var status = req.body.status;
    console.log(req.body);
    if (id == null) {
        return res.json({
            status: false,
            message: "host is is required",
            data: [],
        });
    }
    let hData = await hostModel.findOneAndUpdate(
        { _id: id },
        { $set: { is_active: !status } },
        { new: true }
    );
    console.log("hData:", hData);

    if (hData) {
        return res.json({
            status: true,
            message: `Host ${
                hData.is_active ? "Active" : "Deleted"
            } Successfully`,
            data: hData,
        });
    } else {
        return res.json({
            status: false,
            message: "Host is not found",
            data: [],
        });
    }
};

module.exports.getAllHost = async (req, res) => {
    let hData = await hostModel.find({ user_type: "host" });
    return res.json({
        status: true,
        message: "Host listed succesfully",
        data: hData,
    });
};

module.exports.getVilla = async (req, res) => {
    var id = req.body.villa_id;
    if (id == null) {
        return res.json({
            status: false,
            message: "host is is required",
            data: [],
        });
    }
    var villaData = await villaModel.find({ host: id });
    return res.json({
        status: true,
        message: "villa listed succesfully",
        data: villaData,
    });
};

module.exports.getVillaHost = async (req, res) => {
    let villa_id = req.body.villa_id;
    let villa_name = req.body.villa_name;
    let destination = req.body.destination;
    let host_id = req.body.host_id;
    let vid = {};

    // if(villa_id.trim()!==""){
    //     vid={villa_id:villa_id}
    // }
    let vData = await villaModel
        .aggregate([
            { $match: { host: mongoose.Types.ObjectId(host_id) } },
            { $match: vid },
            {
                $addFields: {
                    results: {
                        $regexMatch: {
                            input: "$villa_name",
                            regex: villa_name,
                            options: "i",
                        },
                    },
                },
            },
            { $match: { results: true } },

            {
                $lookup: {
                    from: "destinations",
                    localField: "destination",
                    foreignField: "_id",
                    as: "destination",
                },
            },
            { $unwind: "$destination" },
            {
                $addFields: {
                    destresult: {
                        $regexMatch: {
                            input: "$destination.destination",
                            regex: destination,
                            options: "i",
                        },
                    },
                },
            },
            { $match: { destresult: true } },
            // {$lookup:{
            //     "from":"users",
            //     "localField":"host",
            //     "foreignField":"_id",
            //     "as":"hostinfo"
            // }},
            // {$unwind:"$hostinfo"},
            // {$match:{"hostinfo.user_type":"host","hostinfo.is_active":true}}
        ])
        .exec();

    return res.json({
        status: true,
        message: "Villa listed succesfully",
        data: vData,
    });
};

module.exports.filterHost = async (req, res) => {
    console.log(req.body);
    let email = req.body.email;
    let mobile_no = req.body.mobile_no;
    let destination = req.body.destination;
    let name = req.body.name;
    let villa_name = req.body.villa_name;
    let data = { user_type: "host" };
    let destfilter = { result: true };
    let villafilter = { result: true };
    if (name && name.trim() != "") {
        // data["name"]=name
    } else {
        name = "";
    }
    if (mobile_no && mobile_no.trim() != "") {
        data["mobile_no"] = mobile_no;
    }
    if (destination && destination.trim() != "") {
        destfilter["result"] = {
            $regexMatch: {
                input: "$destinationinfo.destination",
                regex: destination,
                options: "i",
            },
        };
    }

    if (email && email.trim() != "") {
        data["email"] = email;
    }
    if (villa_name && villa_name.trim() != "") {
        villafilter["result"] = {
            $regexMatch: {
                input: "$villainfo.villa_name",
                regex: villa_name,
                options: "i",
            },
        };
    }
    console.log(destfilter);
    let hostData = await hostModel
        .aggregate([
            { $match: data },
            // {$unwind:{path:"$villainfo",preserveNullAndEmptyArrays:true}},
            {
                $addFields: {
                    result: {
                        $regexMatch: {
                            input: "$name",
                            regex: name,
                            options: "i",
                        },
                    },
                },
            },
            { $match: { result: true } },
            {
                $lookup: {
                    from: "villas",
                    localField: "_id",
                    foreignField: "host",
                    as: "villainfo",
                },
            },
            {
                $unwind: {
                    path: "$villainfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $addFields: villafilter },
            { $match: { result: true } },
            // {$match:villafilter},
            {
                $lookup: {
                    from: "destinations",
                    localField: "villainfo.destination",
                    foreignField: "_id",
                    as: "destinationinfo",
                },
            },
            {
                $unwind: {
                    path: "$destinationinfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $addFields: destfilter },
            { $match: { result: true } },
            // {$match:destfilter},
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    email: { $first: "$email" },
                    mobile_no: { $first: "$mobile_no" },
                    optional_mobile_no: { $first: "$optional_mobile_no" },
                    is_active: { $first: "$is_active" },
                    villa_name: { $push: "$villainfo.villa_name" },
                    villa_id: { $push: "$villainfo._id" },

                    updatedAt: { $first: "updatedAt" },
                },
            },
            { $sort: { updatedAt: 1 } },
        ])
        .exec();
    return res.json({
        status: true,
        message: "destination filter successfully",
        data: hostData,
    });
};

module.exports.sendVerifyEmail = async (req, res) => {
    email = req.body.email;
    var user = await hostModel.findOne({ email: email });
    if (user) {
        sendmail(req, res, user._id, email);
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
    var user = await hostModel.findOneAndUpdate(
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

// Mobile App Api

module.exports.getHostVilla = async (req, res) => {
    let id = req.user.id;
    let hostVilla = await villaModel.find(
        { host: id, is_active: true },
        { villa_name: 1, villa_photos: 1, geoaddress: 1, _id: 1 }
    );
    return res.json({
        status: true,
        message: "Villa listed successfully",
        data: hostVilla,
    });
};

module.exports.getBooking = async (req, res) => {
    let { check_in_date, check_out_date, villa } = req.body;
    let filter = {};
    if (check_in_date && check_in_date.trim() != "") {
        filter["check_in_date"] = check_in_date;
    }
    if (check_out_date && check_out_date.trim() != "") {
        filter["check_out_date"] = check_out_date;
    }
    if (villa && villa.trim() != "") {
        filter["villa"] = mongoose.Types.ObjectId(villa);
    }

    let getBookData = await bookModel
        .aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villainfo",
                },
            },
            { $unwind: "$villainfo" },
            {
                $match: {
                    "villainfo.host": mongoose.Types.ObjectId(req.user.id),
                },
            },
        ])
        .exec();

    return res.json({
        status: true,
        message: "booking listed successfully",
        data: getBookData,
    });
};

//get booking detail by date and villa
module.exports.getBookingByVilla = async (req, res) => {
    let { villa, date } = req.body;
    let filter = {};
    if (villa && villa.trim() != "") {
        filter["villa"] = mongoose.Types.ObjectId(villa);
    }
    if (date && date.trim() != "") {
        filter["check_in_date"] = date;
    }

    let bookData = await bookModel
        .aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villainfo",
                },
            },
            { $unwind: "$villainfo" },
            {
                $match: {
                    "villainfo.host": mongoose.Types.ObjectId(req.user.id),
                },
            },
            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_check_in_time: "$guest_check_in_time",
                    guest_check_out_time: "$guest_check_out_time",
                    total_guest: "$total_guest",
                    guest_mobile_no: "$guest_mobile_no",
                    order_date: "$order_date",
                    villa_name: "$villa_name",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    booking_id: "$booking_id",
                    payment_mode: "$payment_mode",
                },
            },
            { $sort: { check_in_date: 1 } },
        ])
        .exec();

    return res.json({
        status: true,
        message: "booking listed successfully",
        data: bookData,
    });
};

module.exports.getBookingByVillaForMonth = async (req, res) => {
    let { villa, date, month_no } = req.body;
    month_no = new Date(date).getMonth() + 1;
    console.log(month_no);
    let filter = {};
    if (villa && villa.trim() != "") {
        filter["villa"] = mongoose.Types.ObjectId(villa);
    }
    // if(date && date.trim()!=""){
    //     filter["check_in_date"]=date
    // }

    let bookData = await bookModel
        .aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villainfo",
                },
            },
            { $unwind: "$villainfo" },
            {
                $match: {
                    "villainfo.host": mongoose.Types.ObjectId(req.user.id),
                },
            },
            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_check_in_time: "$guest_check_in_time",
                    guest_check_out_time: "$guest_check_out_time",
                    total_guest: "$total_guest",
                    guest_mobile_no: "$guest_mobile_no",
                    order_date: "$order_date",
                    villa_name: "$villa_name",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    booking_id: "$booking_id",
                    payment_mode: "$payment_mode",

                    converted_date: { $month: { $toDate: "$check_in_date" } },
                },
            },
            { $match: { converted_date: month_no } },
            { $sort: { check_in_date: 1 } },
        ])
        .exec();

    return res.json({
        status: true,
        message: "booking listed successfully",
        data: bookData,
    });
};

module.exports.getProfile = async (req, res) => {
    let id = req.user.id;
    let user = await hostModel.findOne({ _id: id });
    if (user) {
        return res.json({
            status: true,
            message: "User detailed successfully",
            data: user,
        });
    } else {
        return res.json({
            status: false,
            message: "user not found",
            data: [],
        });
    }
};

//
const betweenDate = async (datefilter, villafilter) => {
    let bData = await bookModel
        .aggregate([
            { $match: datefilter },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villainfo",
                },
            },
            { $unwind: "$villainfo" },
            { $match: villafilter },
            {
                $group: {
                    _id: "_id",
                    // "_id":"$_id",
                    total_earning: { $sum: "$final_booking_price" },
                    total_booking: { $sum: 1 },
                },
            },
        ])
        .exec();
    let bookingData = await bookModel
        .aggregate([
            { $match: datefilter },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villainfo",
                },
            },
            { $unwind: "$villainfo" },
            { $match: villafilter },
            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_check_in_time: "$guest_check_in_time",
                    guest_check_out_time: "$guest_check_out_time",
                    total_guest: "$total_guest",
                    guest_mobile_no: "$guest_mobile_no",
                    order_date: "$order_date",
                    villa_name: "$villa_name",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    total_guest: "$total_guest",
                    booking_id: "$booking_id",
                    payment_mode: "$payment_mode",
                },
            },
            { $sort: { check_in_date: 1 } },
        ])
        .exec();
    return { bData: bData, bookingData: bookingData };
};

// get booking detail between date

module.exports.getBookingBetweenDate = async (req, res) => {
    let { check_in_date, check_out_date, villa, today_date } = req.body;
    if (!today_date || (today_date && today_date.trim() == "")) {
        return res.json({
            status: false,
            message: "today date is required",
            data: [],
        });
    }
    let seventhDate = moment(today_date)
        .subtract(6, "days")
        .format("YYYY-MM-DD");
    let monthDate = moment(today_date)
        .subtract(29, "days")
        .format("YYYY-MM-DD");
    console.log(monthDate, seventhDate);
    let datefilter = {};
    let villafilter = {};
    let bookData = {};
    villafilter["villainfo.host"] = mongoose.Types.ObjectId(req.user.id);

    if (
        check_in_date &&
        check_in_date.trim() !== "" &&
        check_out_date &&
        check_out_date.trim() !== ""
    ) {
        datefilter["check_in_date"] = {
            $gte: check_in_date,
            $lte: check_out_date,
        };

        if (villa && villa.trim() !== "") {
            villafilter["villainfo._id"] = mongoose.Types.ObjectId(villa);
        }
    }

    let sevenDayFilter = {};
    let monthDayFilter = {};
    bookData["filterbooking"] = await betweenDate(datefilter, villafilter);
    sevenDayFilter["check_in_date"] = { $gte: seventhDate, $lte: today_date };
    bookData["sevenDayFilter"] = await betweenDate(sevenDayFilter, villafilter);
    monthDayFilter["check_in_date"] = { $gte: monthDate, $lte: today_date };
    bookData["monthDayFilter"] = await betweenDate(monthDayFilter, villafilter);

    return res.json({
        status: true,
        message: "Booking Detailed Successfully",
        data: bookData,
    });
};

module.exports.getUpcomingBooking = async (req, res) => {
    let today_date = req.body.today_date;
    if (!today_date || (today_date && today_date.trim() == "")) {
        today_date = new Date().toISOString().slice(0, 10);
    }
    let host_id = req.user.id;
    let bookData = await bookModel
        .find(
            { check_in_date: { $gte: today_date }, host: host_id },
            {
                _id: 1,
                guest_name: 1,
                guest_mobile_no: 1,
                villa_name: 1,
                guest_check_in_time: 1,
                guest_check_out_time: 1,
                total_guest: 1,
                order_date: 1,
                check_in_date: 1,
                check_out_date: 1,
            }
        )
        .sort({ check_in_date: 1 })
        .limit(5);
    return res.json({
        status: true,
        message: "upcoming booking listed successfully",
        data: bookData,
    });
};

module.exports.getBookingDetail = async (req, res) => {
    let booking_id = req.body.booking_id;
    if (!booking_id) {
        return res.json({
            status: false,
            message: "booking id is required",
            data: [],
        });
    } else {
        let bookData = await bookModel.findOne({ _id: booking_id });
        return res.json({
            status: true,
            message: "booking detailed successfully",
            data: bookData,
        });
    }
};

const bookingDetail = async (datefilter, villafilter) => {
    let bData = await bookModel
        .aggregate([
            {
                $addFields: {
                    creationDate: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$order_date",
                        },
                    },
                },
            },
            { $match: datefilter },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villainfo",
                },
            },
            { $unwind: "$villainfo" },
            { $match: villafilter },
            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_check_in_time: "$guest_check_in_time",
                    guest_check_out_time: "$guest_check_out_time",
                    total_guest: "$total_guest",
                    guest_mobile_no: "$guest_mobile_no",
                    order_date: "$order_date",
                    villa_name: "$villa_name",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    total_guest: "$total_guest",
                    booking_id: "$booking_id",
                    payment_mode: "$payment_mode",
                },
            },
            { $sort: { check_in_date: 1 } },
        ])
        .exec();
    return bData;
};

module.exports.todayBooking = async (req, res) => {
    let today_date = req.body.today_date;
    let datefilter = {};
    let villa_filter = {};
    villa_filter["villainfo.host"] = mongoose.Types.ObjectId(req.user.id);
    if (!today_date) {
        today_date = new Date().toISOString().slice(0, 10);
    }
    let villa = req.body.villa;
    datefilter["check_in_date"] = today_date;
    if (villa && villa.trim() !== "") {
        villa_filter["villainfo._id"] = mongoose.Types.ObjectId(villa);
    }

    let bData = await bookingDetail(datefilter, villa_filter);
    return res.json({
        status: true,
        message: "today booking listed successfully",
        data: bData,
    });
};

module.exports.upcomingBookingFilter = async (req, res) => {
    let { check_in_date, check_out_date, villa, today_date } = req.body;
    if (!today_date || (today_date && today_date.trim() == "")) {
        today_date = new Date().toISOString().slice(0, 10);
    }
    let filter = {};
    let villafilter = {};
    villafilter["villainfo.host"] = mongoose.Types.ObjectId(req.user.id);
    filter["check_in_date"] = { $gte: today_date };
    if (
        check_in_date &&
        check_in_date.trim() != "" &&
        check_out_date &&
        check_out_date.trim() != ""
    ) {
        filter["check_in_date"] = { $gte: check_in_date, $lte: check_out_date };
    }

    if (villa && villa.trim() != "") {
        villafilter["villainfo._id"] = mongoose.Types.ObjectId(villa);
    }

    let bData = await bookingDetail(filter, villafilter);
    return res.json({
        status: true,
        messagee: "upcoming booking listed successfully",
        data: bData,
    });
};

module.exports.pastBookingFilter = async (req, res) => {
    let { check_in_date, check_out_date, villa, today_date } = req.body;
    if (!today_date || (today_date && today_date.trim() == "")) {
        today_date = new Date().toISOString().slice(0, 10);
    }
    let filter = {};
    let villafilter = {};
    villafilter["villainfo.host"] = mongoose.Types.ObjectId(req.user.id);
    filter["check_in_date"] = { $lt: today_date };
    if (
        check_in_date &&
        check_in_date.trim() != "" &&
        check_out_date &&
        check_out_date.trim() != ""
    ) {
        filter["check_in_date"] = { $gte: check_in_date, $lte: check_out_date };
    }

    if (villa && villa.trim() != "") {
        villafilter["villainfo._id"] = mongoose.Types.ObjectId(villa);
    }

    let bData = await bookingDetail(filter, villafilter);
    return res.json({
        status: true,
        messagee: "past  booking listed successfully",
        data: bData,
    });
};

module.exports.deleteHostPermanently = async (req, res) => {
    const data = req.body;
    const hostDelete = await deleteData(hostModel, data);
    if (hostDelete.status) {
        return res.json({
            status: true,
            message: "host deleted successfully",
            data: hostDelete.data,
        });
    } else {
        return res.json({
            status: false,
            message: "Host not found",
            data: [],
        });
    }
};
