const bookModel = require("../../models/booking/bookModel");
const mongoose = require("mongoose");
const villaModel = require("../../models/info/villaModel");
const getdays = require("../../lib/date-helper");
const { sendmail } = require("../../lib/mail-helper");
const json2csv = require("json2csv");
var { Parser } = require("json2csv");
const moment = require("moment");
const { notifyHost } = require("../notification/notificationController");
const couponModel = require("../../models/info/couponModel");
const { deleteData } = require("../../lib/queryHelper");
const { bookingMail } = require("../../lib/bookingMail");

function getCallerIP(request) {
    var ip =
        request.headers["x-forwarded-for"] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    ip = ip.split(",")[0];
    ip = ip.split(":").slice(-1); //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
    return ip[0];
}

function generateString() {
    let characters = "0123456789";

    let result = " ";
    const charactersLength = characters.length;
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }

    return result;
}

module.exports.bookVilla = async (req, res) => {
    var data = req.body;
    data["user"] = req.user.id;

    let bid = await generateString();
    data["booking_id"] = "BID-" + bid;

    let villa = data.villa;

    let vdetail = await villaModel.findOne({ _id: villa });
    console.log("vdetail", vdetail);

    if (vdetail) {
        var date1 = data["check_in_date"];
        var date2 = data["check_out_date"];
        const day = await getdays(date1, date2);

        data["guest_check_in_time"] = vdetail.check_in_time;
        data["guest_check_out_time"] = vdetail.check_out_time;
        var booking_price =
            day.weekday * vdetail.weekday_price +
            day.weekend * vdetail.weekend_price;
        if (data.total_guest > vdetail.standard_capacity) {
            let extra_guest = data.total_guest - vdetail.standard_capacity;
            let extra_amount = 0;
            extra_amount =
                extra_guest * day.weekday * vdetail.weekday_price_extra_adult +
                extra_guest * day.weekend * vdetail.weekend_price_extra_adult;
            booking_price = booking_price + extra_amount;
        }
        data["discount_amount"] = 0;

        if (data.coupon_code.trim() !== "") {
            let cData = await couponModel.findOne({
                coupon_code: data.coupon_code,
                is_active: true,
            });
            if (cData) {
                await couponModel.findOneAndUpdate(
                    { coupon_code: data.coupon_code, is_active: true },
                    { $set: { coupont_count: cData.coupont_count + 1 } },
                    { new: true }
                );
                if (cData.discount_type == "Percent Discount") {
                    let percentcount =
                        (booking_price * cData.coupon_amount) / 100;
                    let diff_accnt = booking_price - percentcount;
                    data["discount_amount"] = Math.round(percentcount);
                } else {
                    let percentcount = booking_price - cData.coupon_amount;
                    let diff_accnt = booking_price - percentcount;
                    data["discount_amount"] = Math.round(cData.coupon_amount);
                }
            }
        }
        data["booking_price"] = Math.round(booking_price);
        data["final_booking_price"] = Math.round(
            data["booking_price"] - data["discount_amount"]
        );
        if (data["booking_status"] == "Paid") {
            data["remaining_amount"] = Math.round(
                data["final_booking_price"] - data["final_booking_price"]
            );
            data["advance_amount"] = Math.round(data["final_booking_price"]);
        } else {
            data["remaining_amount"] = Math.round(
                data["final_booking_price"] - data["advance_amount"]
            );
        }
        data["host"] = vdetail.host;
        data["villa_name"] = vdetail.villa_name;
        data["customer_ip"] = await getCallerIP(req);
        //
    }

    var bData = new bookModel(data);
    await bData.save((err, result) => {
        console.log("results => ", result);
        if (!err) {
            let message = `You have booked villa ${vdetail.villa_name} from  ${date1} to ${date2} at ${result.final_booking_price} Rs.`;
            const mailData = {
                villa_name: vdetail.villa_name,
                booking_id: result.booking_id,
                check_in_date: result.check_in_date,
                check_out_date: result.check_out_date,
                check_in_time: result.guest_check_in_time,
                check_out_time: result.guest_check_out_time,
                villa_img: vdetail.villa_photos[0],
                booking_status: result.booking_status,
                adult: result.adult_person,
                children: result.children,
                infants: result.infants,
                final_booking_price: result.final_booking_price,
                advance_amount: result.advance_amount,
                remaining_amount: result.remaining_amount,
                payment_mode: result.payment_mode,
                payment_id: result.payment_id,
                address: vdetail.geoaddress,
                villa_location: {
                    latitude: vdetail.latitude,
                    longitude: vdetail.longitude,
                },
                villa_check_in_time: vdetail.guest_check_in_time,
                villa_check_out_time: vdetail.guest_check_out_time,
            };
            bookingMail(
                req,
                res,
                result.guest_email,
                result.guest_name,
                mailData
            );
            // sendmail(req, res, message, result.guest_email, mailData);
            notifyHost(villa, data.check_in_date, data.check_out_date);
            return res.json({
                status: true,
                message: "villa booked successfully",
                data: result,
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

module.exports.getVillaBooking = async (req, res) => {
    var bData = await bookModel
        .aggregate([
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villa",
                },
            },
            { $unwind: "$villa" },
            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_mobile_no: "$guest_mobile_no",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    "villa.villa_name": "$villa.villa_name",
                    booking_status: "$booking_status",
                    is_active: "$is_active",
                },
            },
            { $sort: { createdAt: -1 } },
        ])
        .exec();

    return res.json({
        status: true,
        message: "villa booking listed successfully",
        data: bData,
    });
};

module.exports.resendConfrimation = async (req, res) => {
    let booking_id = req.body.id;
    var bData = await bookModel
        .aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.body.id) } },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villa",
                },
            },
            { $unwind: "$villa" },
        ])
        .exec();
    if (bData.length > 0) {
        const bookingData = bData[0];
        let message =
            "This is booking confirmation message for the villa " +
            bData[0].villa.villa_name;

        const mailData = {
            villa_name: bookingData.villa.villa_name,
            booking_id: bookingData.booking_id,
            check_in_date: bookingData.check_in_date,
            check_out_date: bookingData.check_out_date,
            check_in_time: bookingData.check_in_time,
            check_out_time: bookingData.check_out_time,
            villa_img: bookingData.villa.villa_photos[0],
            booking_status: bookingData.booking_status,
            adult: bookingData.adult_person,
            children: bookingData.children,
            infants: bookingData.infants,
            final_booking_price: bookingData.final_booking_price,
            advance_amount: bookingData.advance_amount,
            remaining_amount: bookingData.remaining_amount,
            payment_mode: bookingData.payment_mode,
            payment_id: bookingData.payment_id ? bookingData.payment_id : "",
            address: bookingData.villa.geoaddress,
            villa_location: {
                latitude: bookingData.villa.latitude,
                longitude: bookingData.villa.longitude,
            },
        };
        sendmail(req, res, message, bookingData.guest_email, mailData);
        //  notifyHost(villa,data.check_in_date,data.check_out_date)
        // sendmail(req, res, message, bData[0].guest_email);
    }
};

module.exports.getVillaBookingById = async (req, res) => {
    var bData = await bookModel
        .aggregate([
            { $match: { _id: mongoose.Types.ObjectId(req.body.id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villa",
                },
            },
            { $unwind: "$villa" },
        ])
        .exec();

    if (bData.length == 0) {
        return res.json({
            status: false,
            message: "Booking is not found",
            data: [],
        });
    } else {
        return res.json({
            status: true,
            message: "villa booking listed successfully",
            data: bData[0],
        });
    }
};

module.exports.updateVillaBooking = async (req, res) => {
    var data = req.body;
    var id = data.id;
    let villa = data.villa;

    //
    let vdetail = await villaModel.findOne({ _id: villa });
    if (vdetail) {
        var date1 = data["check_in_date"];
        var date2 = data["check_out_date"];
        const day = await getdays(date1, date2);

        var booking_price =
            day.weekday * vdetail.weekday_price +
            day.weekend * vdetail.weekend_price;

        // data["booking_price"] = booking_price;
        // data["discount_amount"] = 0;
        // data["final_booking_price"] =
        //   data["booking_price"] - data["discount_amount"];
        // data["remaining_amount"] =
        //   data["final_booking_price"] - data["advance_amount"];

        // data["customer_ip"] = await getCallerIP(req);
        //
        // data["booking_price"]
        data["host"] = vdetail.host;
        data["villa_name"] = vdetail.villa_name;
    }
    var bData = await bookModel.findOneAndUpdate({ _id: id }, data, {
        new: true,
    });
    if (bData) {
        return res.json({
            status: true,
            message: "Booking detail is updated",
            data: bData,
        });
    } else {
        return res.json({
            status: false,
            message: "Booking is not found",
            data: [],
        });
    }
};

module.exports.getUserBooking = async (req, res) => {
    var bData = await bookModel
        .aggregate([
            { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },

            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villa",
                },
            },
            { $unwind: "$villa" },

            { $sort: { createdAt: -1 } },
        ])
        .exec();

    // if(bData.length==0){
    //     return res.json({
    //         "status":false,
    //         "message":"Booking is not found",
    //         "data":[]
    //     })
    // }
    return res.json({
        status: true,
        message: "villa booking listed successfully",
        data: bData,
    });
};

module.exports.getCalendarBooking = async (req, res) => {
    let villa = req.body.villa;
    let filter = {};
    if (villa && villa.trim() != "") {
        filter = { villa: villa };
    }

    let bData = await bookModel.find(filter);
    return res.json({
        status: true,
        message: "Booking Listed Successfully",
        data: bData,
    });
};

module.exports.filterBookingByDate = async (req, res) => {
    let check_in_date = req.body.check_in_date;
    let check_out_date = req.body.check_out_date;
    let date1 = "";
    let date2 = "";
    if (
        check_in_date &&
        check_in_date.trim() != "" &&
        check_out_date &&
        check_out_date.trim() != ""
    ) {
        date1 = moment(check_in_date).format("YYYY-MM-DD");
        date2 = moment(check_out_date).format("YYYY-MM-DD");
    } else {
        return res.json({
            status: false,
            message: "start date and end date is required",
            data: [],
        });
    }

    let bData = await bookModel
        .aggregate([
            { $match: { check_in_date: { $gte: date1, $lt: date2 } } },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villa",
                },
            },
            { $unwind: "$villa" },
            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_mobile_no: "$guest_mobile_no",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    "villa.villa_name": "$villa.villa_name",
                    booking_status: "$booking_status",
                    is_active: "$is_active",
                },
            },
        ])
        .exec();

    return res.json({
        status: true,
        message: "Booking filter successfully",
        data: bData,
    });
};

module.exports.filterBooking = async (req, res) => {
    //
    let booking_id = req.body.booking_id;
    let guest_name = req.body.guest_name;
    let mobile_no = req.body.mobile_no;
    let check_in_date = req.body.check_in_date;
    let check_out_date = req.body.check_out_date;
    let villa_name = req.body.villa_name;
    let data = {};
    let villaData = {};
    let filterdate = [{}];
    if (booking_id && booking_id.trim() != "") {
        data["booking_id"] = booking_id;
    }
    // if (guest_name && guest_name.trim() != "") {
    //   data["guest_name"] = guest_name;
    // }
    if (mobile_no && mobile_no.trim() != "") {
        data["guest_mobile_no"] = mobile_no;
    }
    if (check_in_date.trim() !== "" && check_out_date.trim() !== "") {
        filterdate = [
            { check_in_date: { $gte: check_in_date } },
            { check_in_date: { $lte: check_out_date } },
        ];
    }
    if (villa_name && villa_name.trim() !== "") {
        villaData["villa.villa_name"] = villa_name;
    }
    // else {villa_name=""}

    let bookData = await bookModel
        .aggregate([
            { $match: data },
            {
                $addFields: {
                    guestName: {
                        $regexMatch: {
                            input: "$guest_name",
                            regex: guest_name,
                            options: "i",
                        },
                    },
                },
            },
            { $match: { guestName: true } },
            { $match: { $and: filterdate } },
            {
                $lookup: {
                    from: "villas",
                    localField: "villa",
                    foreignField: "_id",
                    as: "villa",
                },
            },

            { $unwind: "$villa" },
            {
                $addFields: {
                    results: {
                        $regexMatch: {
                            input: "$villa.villa_name",
                            regex: villa_name,
                            options: "i",
                        },
                    },
                },
            },
            { $match: { results: true } },
            // {$match:villaData},
            { $sort: { createdAt: -1 } },

            {
                $project: {
                    _id: "$_id",
                    guest_name: "$guest_name",
                    guest_mobile_no: "$guest_mobile_no",
                    check_in_date: "$check_in_date",
                    check_out_date: "$check_out_date",
                    "villa.villa_name": "$villa.villa_name",
                    booking_status: "$booking_status",
                    order_date: "$order_date",
                    is_active: "$is_active",
                },
            },
        ])
        .exec();

    return res.json({
        status: true,
        message: "booking filter successfully",
        data: bookData,
    });
};

//inactive the booking

module.exports.changeBookingStatus = async (req, res) => {
    let booking_id = req.body.booking_id.trim();

    let status = req.body.status;
    let updateBooking = await bookModel.findOneAndUpdate(
        { _id: mongoose.Types.ObjectId(booking_id) },
        { $set: { is_active: !status } },
        { new: true }
    );
    if (updateBooking) {
        return res.json({
            status: true,
            message: `Booking is ${
                updateBooking ? "Active" : "InActive"
            } successfully`,
            data: updateBooking,
        });
    } else {
        return res.json({
            status: false,
            message: "Something went wrong",
            data: [],
        });
    }
};

module.exports.getCsv = async (req, res) => {
    const fields = [
        {
            label: "Booking Id",
            value: "booking_id",
        },
        {
            label: "Status",
            value: "booking_status",
        },
        {
            label: "Guest Check In Date",
            value: "check_in_date",
        },
        {
            label: "Guest Check Out Date",
            value: "check_out_date",
        },

        {
            label: "Villa Name",
            value: "villa_name",
        },
        {
            label: "Guest Name",
            value: "guest_name",
        },
        {
            label: "Guest Mobile Number",
            value: "guest_mobile_no",
        },
        {
            label: "Person",
            value: "total_guest",
        },
        {
            label: "Advance amount",
            value: "advance_amount",
        },
        {
            label: "Remaining amount",
            value: "remaining_amount",
        },
        // {
        //   label: "Order Date",
        //   value: "order_date",
        // },
    ];
    let filterdate = [{}];
    let { date1, date2 } = req.params;
    if (date1.trim() != 0 || date2.trim() != 0) {
        filterdate = [
            { check_in_date: { $gte: date1 } },
            { check_in_date: { $lte: date2 } },
        ];
    }
    const json2csv = new Parser({ fields: fields });
    let bdata = await bookModel.find(
        { $and: filterdate },
        {
            guest_name: 1,
            guest_mobile_no: 1,
            check_in_date: 1,
            check_out_date: 1,
            villa_name: 1,
            // order_date: 1,
            total_guest: 1,
            remaining_amount: 1,
            advance_amount: 1,
            booking_id: 1,
            booking_status: 1,
        }
    );

    try {
        const csv = json2csv.parse(bdata);
        res.attachment("data.csv");
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports.adminVillaBook = async (req, res) => {
    const data = req.body;
    console.log(data);
    data["user"] = req.session.admin_id;

    let bid = await generateString();
    data["booking_id"] = "BID-" + bid;
    data["payment_mode"] = "Cash";
    let villa = data.villa;

    let vdetail = await villaModel.findOne({ _id: villa });
    if (vdetail) {
        var date1 = data["check_in_date"];
        var date2 = data["check_out_date"];
        const day = await getdays(date1, date2);

        data["guest_check_in_time"] = vdetail.check_in_time;
        data["guest_check_out_time"] = vdetail.check_out_time;
        var booking_price =
            day.weekday * vdetail.weekday_price +
            day.weekend * vdetail.weekend_price;
        if (data.total_guest > vdetail.standard_capacity) {
            let extra_guest = data.total_guest - vdetail.standard_capacity;
            let extra_amount = 0;
            extra_amount =
                extra_guest * day.weekday * vdetail.weekday_price_extra_adult +
                extra_guest * day.weekend * vdetail.weekend_price_extra_adult;

            booking_price = booking_price + extra_amount;
        }

        if (data.coupon_code && data.coupon_code.trim() !== "") {
            let cData = await couponModel.findOne({
                coupon_code: data.coupon_code,
                is_active: true,
            });
            if (cData) {
                await couponModel.findOneAndUpdate(
                    { coupon_code: data.coupon_code, is_active: true },
                    { $set: { coupont_count: cData.coupont_count + 1 } },
                    { new: true }
                );
                if (cData.discount_type == "Percent Discount") {
                    let percentcount =
                        (booking_price * cData.coupon_amount) / 100;
                    let diff_accnt = booking_price - percentcount;
                    data["discount_amount"] = percentcount;
                } else {
                    let percentcount = booking_price - cData.coupon_amount;
                    let diff_accnt = booking_price - percentcount;
                    data["discount_amount"] = cData.coupon_amount;
                }
            }
        }
        //     if (!data.advance_amount){
        //    data["advance_amount"]=booking_price;
        //  }

        data["booking_price"] = Math.round(booking_price);
        data["final_booking_price"] = Math.round(
            data["booking_price"] - data["discount_amount"]
        );
        if (data["booking_status"] == "Paid") {
            data["remaining_amount"] =
                data["final_booking_price"] - data["advance_amount"];
            //  data["advance_amount"]= data["final_booking_price"]
        } else {
            data["remaining_amount"] =
                data["final_booking_price"] - data["advance_amount"];
        }
        data["host"] = vdetail.host;
        data["villa_name"] = vdetail.villa_name;
        //  data["customer_ip"]=await getCallerIP(req)
        //
    }

    if (Number(data["remaining_amount"]) == 0) {
        data["booking_status"] = "Paid";
    } else if (
        Number(data["remaining_amount"]) == data["final_booking_price"]
    ) {
        data["booking_status"] = "On-hold";
    } else {
        data["booking_status"] = "Partially paid";
    }
    var bData = new bookModel(data);
    await bData.save((err, result) => {
        if (!err) {
            let message = `You have booked villa ${vdetail.villa_name} from  ${date1} to ${date2} at ${result.final_booking_price} Rs.`;
            const mailData = {
                villa_name: vdetail.villa_name,
                booking_id: result.booking_id,
                check_in_date: result.check_in_date,
                check_out_date: result.check_out_date,
                check_in_time: result.check_in_time,
                check_out_time: result.check_out_time,
                villa_img: vdetail.villa_photos[0],
                booking_status: result.booking_status,
                adult: result.adult_person,
                children: result.children,
                infants: result.infants,
                final_booking_price: result.final_booking_price,
                advance_amount: result.advance_amount,
                remaining_amount: result.remaining_amount,
                payment_mode: result.payment_mode,
                payment_id: result.payment_id,
                address: vdetail.geoaddress,
                villa_location: {
                    latitude: vdetail.latitude,
                    longitude: vdetail.longitude,
                },
            };
            sendmail(req, res, message, result.guest_email, mailData);
            notifyHost(villa, data.check_in_date, data.check_out_date);
            return res.json({
                status: true,
                message: "villa booked successfully",
                data: result,
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

module.exports.deleteHardBooking = async (req, res) => {
    const data = req.body;
    const bData = await deleteData(bookModel, data);
    if (bData.status) {
        return res.json({
            status: true,
            message: "Booking deleted successfully",
            data: [],
        });
    } else {
        return res.json({
            status: false,
            message: "Booking not found",
            data: [],
        });
    }
};
