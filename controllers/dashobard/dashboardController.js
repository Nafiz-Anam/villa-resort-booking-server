const villaModel = require("../../models/info/villaModel");
const bookModel = require("../../models/booking/bookModel");
const moment = require("moment");

const betweenDate = async (date1, date2) => {
    let bData = await bookModel
        .aggregate([
            { $match: { check_in_date: { $gte: date1, $lt: date2 } } },
            {
                $match: {
                    is_active: true,
                    booking_status: {
                        $in: ["Paid", "Partially paid", "On-hold"],
                    },
                },
            },
            {
                $group: {
                    _id: "_id",
                    total_booking: { $sum: "$final_booking_price" },
                    total: { $sum: 1 },
                },
            },
        ])
        .exec();
    // console.log(bData);
    return bData;
};

const singleData = async (date1) => {
    let bData = await bookModel.aggregate([
        {
            $match: {
                is_active: true,
                booking_status: {
                    $in: ["Paid", "Partially paid", "On-hold"],
                },
                check_in_date: {
                    $in: [date1],
                },
            },
        },
        {
            $group: {
                _id: "_id",
                total_booking: { $sum: "$final_booking_price" },
                total: { $sum: 1 },
            },
        },
    ]);
    // console.log("single date => ", bData);

    return bData;
};

module.exports.allBooking = async (req, res) => {
    let allbooking = await bookModel
        .aggregate([
            {
                $match: {
                    is_active: true,
                    booking_status: {
                        $in: ["Paid", "Partially paid", "On-hold"],
                    },
                },
            },
            {
                $group: {
                    _id: "_id",
                    total_booking: { $sum: "$final_booking_price" },
                    total: { $sum: 1 },
                },
            },
        ])
        .exec();

    // let today = new Date();
    let todaydate = moment().format("YYYY-MM-DD");
    // console.log(todaydate);
    let sevenday = moment().subtract(7, "d").format("YYYY-MM-DD");
    let monthDate = moment().subtract(30, "d").format("YYYY-MM-DD");
    let lastMonth = moment(monthDate).subtract(30, "d").format("YYYY-MM-DD");
    let begin = moment().format("YYYY-MM-01");
    // modified
    const firstDate = moment()
        .subtract(1, "months")
        .startOf("month")
        .format("YYYY-MM-DD");
    const lastDate = moment()
        .subtract(1, "months")
        .endOf("month")
        .format("YYYY-MM-DD");

    let pastSevenDayData = await betweenDate(sevenday, todaydate);
    let pastMonthData = await betweenDate(monthDate, todaydate);
    // modified
    let lastMonthData = await betweenDate(firstDate, lastDate);
    // let lastMonthData = await betweenDate(lastMonth, monthDate);
    // let todayData = await betweenDate(todaydate, todaydate);
    // modified
    let thisMonth = await betweenDate(begin, todaydate);
    let todayData = await singleData(todaydate);

    let data = {};

    data["allbooking"] = allbooking;
    data["sevendaybooking"] = pastSevenDayData;
    data["pastMonthData"] = pastMonthData;
    // modified
    data["todayData"] = todayData;
    data["lastMonthData"] = lastMonthData;
    data["thisMonth"] = thisMonth;

    return res.json({
        status: true,
        message: "total booking price detailed",
        data: data,
    });
};

module.exports.getBeweenDateBooking = async (req, res) => {
    let form_date = req?.body?.form_date;
    let end_date = req?.body?.end_date;

    if (!form_date && !end_date) {
        return res.json({
            status: false,
            message: "Both date is required",
            data: [],
        });
    } else if (form_date && !end_date) {
        let data = await singleData(form_date);
        return res.json({
            status: true,
            messag: "booking detailed successfully",
            data: data,
        });
    } else {
        form_date = moment(form_date).format("YYYY-MM-DD");
        end_date = moment(end_date).format("YYYY-MM-DD");
        // console.log(form_date);
        // console.log(end_date);
        let data = await betweenDate(form_date, end_date);
        // console.log(data);
        return res.json({
            status: true,
            messag: "booking detailed successfully",
            data: data,
        });
    }
};
