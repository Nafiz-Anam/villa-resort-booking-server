const { validationResult } = require("express-validator");
const villaModel = require("../../models/info/villaModel");
const bookModel = require("../../models/booking/bookModel");
const destinationModel = require("../../models/info/destinationModel");
const mongoose = require("mongoose");
const { getAddress } = require("../../lib/get-location");
const moment = require("moment");
const { env } = require("../../config/config");
const { deleteImage, deleteData } = require("../../lib/queryHelper");

module.exports.createVilla = async (req, res) => {
    if (req.body._id !== "null") {
        updateVilla(req, res);
    } else {
        saveVilla(req, res);
    }
};

const saveVilla = async (req, res) => {
    var validError = validationResult(req);
    if (!validError.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }
    //

    var data = req.body;
    let villa_name = req.body.villa_name;
    let destination = req.body.destination;
    let vDetail = await villaModel.findOne({
        villa_name: villa_name,
        destination: destination,
    });
    console.log("vDetail", vDetail);

    // data["host"] = vDetail.host;
    if (vDetail) {
        return res.json({
            status: false,
            message: "Villa name already taken",
            data: [],
        });
    }

    let filelist = [];

    for (let i in req.files) {
        if (req.files[i].fieldname == "villa_photos") {
            let k = "media/" + req.files[i].filename;
            filelist.push(k);
        } else if (req.files[i].fieldname == "youtube_video_bannner") {
            let k = "media/" + req.files[i].filename;
            data["youtube_video_banner"] = k;
        } else {
            continue;
        }
    }
    data["villa_photos"] = filelist;

    // if (req.file) {
    //     var k = "media/" + req.file.filename
    //     data["destination_img"]=k
    // }

    data["villa_id"] = Math.random().toString(36).slice(2);
    let address = await getAddress(data.latitude, data.longitude);
    data["geoaddress"] = address;
    delete data._id;
    let vData = new villaModel(data);
    await vData.save((err, result) => {
        if (!err) {
            return res.json({
                status: true,
                message: "Villa created successfully",
                data: result,
            });
        } else {
            // const paramURL=`${env.server_url}/${req.body.destination_name}/${result.villa_name}`
            // villaModel.findOneAndUpdate({_id:result._id},{$set:{permlink:paramURL}},{new:true})
            return res.json({
                status: false,
                message: err.message,
                data: [],
            });
        }
    });
};

//update villa

const updateVilla = async (req, res) => {
    var validError = validationResult(req);
    if (!validError.isEmpty()) {
        return res.json({
            status: false,
            message: a.array()[0].msg,
            data: [],
        });
    }
    var id = req.body._id;
    //
    var data = req.body;
    let villa_name = req.body.villa_name;
    let destination = req.body.destination;
    let vDetail = await villaModel.findOne({
        _id: { $ne: id },
        villa_name: villa_name,
        destination: destination,
    });
    if (vDetail) {
        return res.json({
            status: false,
            message: "Villa name already taken",
            data: [],
        });
    }
    let filelist = [];
    delete data.villa_photos;
    if (req.files.length > 0) {
        for (var i in req.files) {
            if (req.files[i].fieldname == "villa_photos") {
                let k = "media/" + req.files[i].filename;
                filelist.push(k);
            } else if (req.files[i].fieldname == "youtube_video_bannner") {
                let k = "media/" + req.files[i].filename;
                data["youtube_video_banner"] = k;
            } else {
                continue;
            }
        }
        data["$push"] = { villa_photos: { $each: filelist } };

        // data["villa_photos"]=filelist
    }
    if (id == null) {
        return res.json({
            status: false,
            message: "villa id is required",
            data: [],
        });
    }
    let address = await getAddress(data.latitude, data.longitude);
    data["geoaddress"] = address;

    let vData = await villaModel.findOneAndUpdate({ _id: id }, data, {
        new: true,
    });
    if (vData) {
        return res.json({
            status: true,
            message: "villa updated successfully",
            data: vData,
        });
    } else {
        return res.json({
            status: false,
            message: "villa is not found",
            data: [],
        });
    }
};

module.exports.deleteVilla = async (req, res) => {
    var id = req.body.id;
    var data = req.body;
    var status = req.body.status;
    if (id == null) {
        return res.json({
            status: false,
            message: "villa id is required",
            data: [],
        });
    }

    let vData = await villaModel.findOneAndUpdate(
        { _id: id },
        { $set: { is_active: !status, status: !status } },
        { new: true }
    );
    if (vData) {
        return res.json({
            status: true,
            message: "villa updated successfully",
            data: vData,
        });
    } else {
        return res.json({
            status: false,
            message: "villa is not found",
            data: [],
        });
    }
};

//for admin

module.exports.getadminVilla = async (req, res) => {
    let vData = await villaModel.find({}).populate("host destination");
    return res.json({
        status: true,
        message: "villa listed successfully",
        data: vData,
    });
};

module.exports.getActiveVilla = async (req, res) => {
    let vData = await villaModel.find({ is_active: true });
    return res.json({
        status: true,
        message: "villa listed successfullly",
        data: vData,
    });
};

module.exports.getVilla = async (req, res) => {
    let limit = parseInt(req.params.limit);
    let total_count = await villaModel.find({ is_active: true }).count();
    let villaData = await villaModel.aggregate([
        { $match: { status: true } },

        {
            $lookup: {
                from: "destinations",
                localField: "destination",
                foreignField: "_id",
                as: "destination",
            },
        },
        { $unwind: "$destination" },
        { $match: { "destination.is_active": true } },
        {
            $lookup: {
                from: "users",
                localField: "host",
                foreignField: "_id",
                as: "hostinfo",
            },
        },
        { $unwind: "$hostinfo" },
        { $match: { "hostinfo.is_active": true } },

        {
            $project: {
                hostinfo: { token: 0, user_type: 0 },
            },
        },

        { $limit: limit },
    ]);
    return res.json({
        status: true,
        message: "villa listed successfully",
        data: {
            data: villaData,
            total_count: total_count,
        },
    });
};

module.exports.detailVilla = async (req, res) => {
    var id = req.body.id;
    var villa_name = req.body.villa_name;
    var destination = req.body.destination;
    var data = req.body;

    if (id == null) {
        return res.json({
            status: false,
            message: "villa id is required",
            data: [],
        });
    }

    let vDetail = await villaModel
        .aggregate([
            // { $addFields: { results: { $regexMatch: { input: "$villa_name", regex:villa_name }  } } } ,
            // {$match:{results:true}},
            { $match: { villa_name: villa_name } },
            {
                $lookup: {
                    from: "users",
                    localField: "host",
                    foreignField: "_id",
                    as: "host",
                },
            },
            { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "destinations",
                    localField: "destination",
                    foreignField: "_id",
                    as: "destination",
                },
            },
            { $unwind: "$destination" },

            // { $addFields: { results: { $regexMatch: { input: "$destination.destination", regex:destination,options:'i' }  } } } ,
            // {$match:{results:true}},
            { $match: { "destination.destination": destination } },
            {
                $lookup: {
                    from: "amenities",
                    localField: "amenities",
                    foreignField: "_id",
                    as: "amenities",
                },
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "villa",
                    as: "bookings",
                },
            },

            {
                $project: {
                    host: { token: 0, user_type: 0 },
                },
            },
        ])
        .exec();

    if (vDetail.length > 0) {
        return res.json({
            status: true,
            message: "villa detailed successfully",
            data: vDetail[0],
        });
    } else {
        return res.json({
            status: false,
            message: "villa is not found",
            data: [],
        });
    }
};

module.exports.detailVillaForHost = async (req, res) => {
    var id = req.body.id;
    var date = moment(req.body.date).utcOffset("+05:30").format("YYYY-MM-DD");

    if (id == null) {
        return res.json({
            status: false,
            message: "villa id is required",
            data: [],
        });
    }

    let vDetail = await bookModel
        .aggregate([
            {
                $addFields: {
                    check_date: {
                        $toDate: "$check_in_date",
                    },
                },
            },
            {
                $match: {
                    villa: mongoose.Types.ObjectId(id),

                    is_active: true,
                    booking_status: {
                        $in: ["Paid", "Partially paid", "On-hold"],
                    },
                    check_date: { $gte: new Date(date) },
                },
            },
        ])
        .exec();

    if (vDetail.length > 0) {
        return res.json({
            status: true,
            message: "villa detailed successfully",
            data: vDetail,
        });
    } else {
        return res.json({
            status: false,
            message: "villa is not found",
            data: [],
        });
    }
};

module.exports.detailVillaAdmin = async (req, res) => {
    var id = req.body.id;
    var villa_name = req.body.villa_name;
    var data = req.body;
    if (id == null) {
        return res.json({
            status: false,
            message: "villa id is required",
            data: [],
        });
    }

    // let vData = await villaModel.findOne({_id:id}).populate("host destination")
    let vDetail = await villaModel
        .aggregate([
            // { $addFields: { results: { $regexMatch: { input: "$villa_name", regex:villa_name,options:'i' }  } } } ,
            { $match: { _id: mongoose.Types.ObjectId(id) } },

            {
                $lookup: {
                    from: "users",
                    localField: "host",
                    foreignField: "_id",
                    as: "host",
                },
            },
            { $unwind: "$host" },
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
                $lookup: {
                    from: "amenities",
                    localField: "amenities",
                    foreignField: "_id",
                    as: "amenities",
                },
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "villa",
                    as: "bookings",
                },
            },

            {
                $project: {
                    host: { token: 0, user_type: 0 },
                },
            },
        ])
        .exec();

    if (vDetail.length > 0) {
        return res.json({
            status: true,
            message: "villa detailed successfully",
            data: vDetail[0],
        });
    } else {
        return res.json({
            status: false,
            message: "villa is not found",
            data: [],
        });
    }
};

// module.exports.searchVilla = async(req,res) => {
//     var destination = req.body.destination
//     var checkoutdate = req.body.check_out_date
//     var checkindate = req.body.check_in_date
//     var guest=req.body.guest

//     var vData = await destinationModel.aggregate([
//         { $addFields: { results: { $regexMatch: { input: "$destination", regex:destination,options:'i' }  } } },

//         {
//             "$lookup":{
//                 "from":"villas",
//                 "localField":"_id",
//                 "foreignField":"destination",
//                 "as":"villa"
//             }
//         },

//        {$match:{results:true,"villa.max_capacity":{$gte:guest}}},

//     ]).exec()

//     return res.json({
//         "status":true,
//         "message":"Villa Filtered Succesfully",
//         "data":vData
//     })
// }

module.exports.searchVilla = async (req, res) => {
    var destination = req.body.destination;
    var checkoutdate = req.body.check_out_date;
    var checkindate = req.body.check_in_date;
    var guest = req.body.guest;

    var vData = await villaModel
        .aggregate([
            // { $addFields: { results: { $regexMatch: { input: "$destination", regex:destination,options:'i' }  } } },
            { $match: { status: true } },
            {
                $lookup: {
                    from: "destinations",
                    localField: "destination",
                    foreignField: "_id",
                    as: "destination",
                },
            },

            {
                $match: {
                    "destination.destination": destination,
                    max_capacity: { $gte: guest },
                },
            },
        ])
        .exec();

    return res.json({
        status: true,
        message: "Villa Filtered Successfully",
        data: vData,
    });
};

module.exports.getDestinationVilla = async (req, res) => {
    var destination = req.body.destination.toLowerCase();
    var startdate = moment(req.body.startdate)
        .utcOffset("+05:30")
        .format("YYYY-MM-DD");
    var enddate = moment(req.body.enddate)
        .utcOffset("+05:30")
        .format("YYYY-MM-DD");

    var guest = req.body.guest;

    if (guest == undefined || guest == "") {
        guest = 1;
    }

    var destVilla = await destinationModel
        .aggregate([
            { $match: { destination: destination, is_active: true } },
            // { $addFields: { results: { $regexMatch: { input: "$destination", regex:destination,options:'i' }  } } },

            {
                $lookup: {
                    from: "villas",
                    localField: "_id",
                    foreignField: "destination",
                    as: "villainfo",
                },
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "villainfo._id",
                    foreignField: "villa",
                    as: "bookinginfo",
                },
            },

            // {$unwind:{path:"$villainfo.bookinginfo",preserveNullAndEmptyArrays:true}}
        ])
        .exec();

    if (destVilla.length > 0) {
        let vinfo = destVilla[0].villainfo;
        let getVillaId = vinfo.map((vi) => vi._id);

        var booking = destVilla[0].bookinginfo;
        if (req.body.startdate == null || req.body.enddate == null) {
            let vfilter = vinfo.filter((v) => {
                return v.max_capacity >= guest && v.status == true;
            });
            destVilla[0].villainfo = vfilter;
        } else {
            var villaid = [];
            //

            for (let i in booking) {
                //
                var indate = booking[i].check_in_date;
                var outdate = booking[i].check_out_date;
                var userindate = startdate;
                var useroutdate = enddate;

                if (
                    (userindate < indate && useroutdate <= indate) ||
                    (userindate >= outdate && useroutdate >= outdate)
                ) {
                    //
                } else if (booking[i].is_active == false) {
                    //
                } else if (
                    !["Paid", "Partially paid", "On-hold"].includes(
                        booking[i].booking_status
                    )
                ) {
                    //
                } else {
                    //

                    var vid = JSON.stringify(booking[i].villa);
                    var isexist = villaid.indexOf(vid);
                    if (isexist == -1)
                        villaid.push(JSON.stringify(booking[i].villa));
                }
            }
            //
            var newVilla = vinfo.filter((v) => {
                var k = JSON.stringify(v._id);
                return (
                    villaid.indexOf(k) == -1 &&
                    v.max_capacity >= guest &&
                    v.is_active == true
                );
            });
            //
            destVilla[0].villainfo = newVilla;
        }

        return res.json({
            status: true,
            message: "villa filterd successfully",
            data: destVilla[0],
        });
    } else {
        return res.json({
            status: false,
            message: "destination not found",
            data: [],
        });
    }
};

module.exports.similarVilla = async (req, res) => {
    var guest = req.body.guest;
    var destination = req.body.destination;
    let vData = await villaModel
        .find({ $or: [{ destination: destination }], is_active: true })
        .populate("destination");

    return res.json({
        status: true,
        message: "Similar Villa Listed",
        data: vData,
    });
};

module.exports.getBookedDate = async (req, res) => {
    let villa = req.body.villa;
    let allDate = await bookModel
        .find({ villa: villa })
        .select({ check_in_date: 1, check_out_date: 1 });
    return res.json({
        status: true,
        message: "Villa Booking dates are listed",
        data: allDate,
    });
};

module.exports.validateVilla = async (req, res) => {
    let id = req.body.villa;
    let startdate = req.body.startdate;
    let enddate = req.body.enddate;
    let guest = req.body.guest;

    var todayDate = new Date().toISOString().slice(0, 10);
    let flag = 0;

    let vData = await villaModel
        .aggregate([
            { $match: { _id: mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "villa",
                    as: "bookinginfo",
                },
            },
            { $unwind: "$bookinginfo" },
            {
                $addFields: {
                    "bookinginfo.convertedDate": {
                        $toDate: "$bookinginfo.check_out_date",
                    },
                },
            },
            {
                $match: {
                    "bookinginfo.convertedDate": { $gte: new Date(startdate) },
                    "bookinginfo.booking_status": {
                        $in: ["Paid", "Partially paid", "On-hold"],
                    },
                    "bookinginfo.is_active": true,
                },
            },

            {
                $group: {
                    _id: "$_id",
                    bookinginfo: { $push: "$bookinginfo" },
                },
            },
        ])
        .exec();
    for (let i in vData) {
        let booking = vData[i].bookinginfo;

        if (booking.length > 0) {
            for (let j in booking) {
                if (
                    (startdate < booking[j].check_in_date &&
                        enddate <= booking[j].check_in_date) ||
                    (startdate >= booking[j].check_out_date &&
                        enddate > booking[j].check_out_date)
                ) {
                    flag = 0;
                } else {
                    flag = 1;
                    break;
                }
            }
        }
    }
    if (flag == 0) {
        return res.json({
            status: true,
            message: "villa is avalaible",
            data: [],
        });
    } else {
        return res.json({
            status: false,
            message: "Villa is not avaliable",
            data: [],
        });
    }
};

module.exports.filterVilla = async (req, res) => {
    let villa_id = req.body.villa_id;
    let villa_name = req.body.villa_name;
    let destination = req.body.destination;
    let vid = {};

    // if(villa_id.trim()!==""){
    //     vid={villa_id:villa_id}
    // }
    let vData = await villaModel
        .aggregate([
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
        message: "Villa listed successfully",
        data: vData,
    });
};

module.exports.removeImage = async (req, res) => {
    const data = req.body;

    let imgData = await deleteImage(villaModel, data);
    return res.json(imgData);
};

module.exports.deleteVillaPermanently = async (req, res) => {
    const data = req.body;
    const dData = await deleteData(villaModel, data);
    if (dData.status) {
        return res.json({
            status: true,
            message: "Villa deleted successfully",
            data: dData.data,
        });
    } else {
        return res.json({
            status: false,
            message: "Villa not found",
            data: [],
        });
    }
};
