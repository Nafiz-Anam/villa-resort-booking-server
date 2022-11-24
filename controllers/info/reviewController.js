const villaReviewModel = require("../../models/info/villaReviewModel")
const mongoose = require("mongoose")
const { deleteData } = require("../../lib/queryHelper")
const reviewModel = require("../../models/info/villaReviewModel")
module.exports.create = async(req,res) => {
    let data = req.body
    console.log(data)
    let reviewData = new villaReviewModel(data)
    await reviewData.save((err,result) => {
        if(!err) {
            return res.json({
                "status":true,
                "message":"Your review submitted successfully",
                "data":result
            })
        }
        else {
            return res.json({
                "status":false,
                "message":err,
                "data":[]
            })
        }
    })
}


module.exports.approveReview = async(req,res) => {
    let reviewId = req.body.reviewId
    let status = req.body.status
    console.log(status)
    if(reviewId==null){
        return res.json({
            'status':false,
            "message":"review id is required",
            "data":[]
        })
    }

    else {
        let reviewData = await villaReviewModel.findOneAndUpdate({_id:reviewId},{$set:{is_approve:status}},{new:true})
        if(reviewData){
            return res.json({
                "status":true,
                "message":"Review updated successfully",
                "data":reviewData
            })
        }
        else {
            return res.json({
                "status":false,
                "message":"Review Not found",
                "data":[]
            })
        }
    }
}


module.exports.getAllReview =async(req,res) => {
    let reviewData = await villaReviewModel.find({}).populate([{path:"villa"},{path:"user",select:"-token"}])

    return res.json({
        "status":true,
        "message":"review listed successfully",
        "data":reviewData
    })
}


module.exports.getVillaReview = async(req,res) => {
    
    let villaId = req.body.villaId
    console.log(req.body)
    if(villaId==null){
        return res.json({
            "status":false,
            "message":"Villa id is required",
            "data":[]
        })
    }
    else {
        let review = await villaReviewModel.find({villa:villaId,is_approve:true}).populate([{ path: 'villa' }, { path: "user", select: "-token" }])
        return res.json({
            "status":true,
            "message":"Review Listed Successfully", 
            "data":review
        })

    }
}


module.exports.detailReview = async(req,res) => {
    let reviewId = req.body.reviewId
    if(reviewId==null){
        return res.json({
            'status':false,
            "message":"review id is required",
            "data":[]
        })
    }

    else {
        let reviewData = await villaReviewModel.findOne({_id:reviewId}).populate([{path:'villa'},{path:'user',select:'-token'}])

        if(reviewData){
            return res.json({
                "status":true,
                "message":"Review detailed successfully",
                "data":reviewData
            })
        }
        else {
            return res.json({
                "status":false,
                "message":"Review Not found",
                "data":[]
            })
        }
    }
}


module.exports.recentReview = async(req,res) => {
    console.log("recent review")
    // let reviewData = await villaReviewModel.find({is_approve:true}).populate([{path:'villa',select:{'villa_name':1,"is_active":1}},{path:'user',select:'-token'}]).limit(10)
    let reviewData  = await villaReviewModel.aggregate([
        {
            "$lookup":{
                "from":"villas",
                "localField":"villa",
                "foreignField":"_id",
                "as":"villa"
            }
        },
        {$unwind:"$villa"},
        {$match:{"villa.is_active":true}},
        {
            "$lookup":{
                "from":"users",
                "localField":"user",
                "foreignField":"_id",
                "as":"user"

            }
        },
        {$unwind:"$user"},
        {$limit:10},
        {$group:{
            "_id":"$_id",
            "review":{$first:"$review"},
            "villa":{$first:"$villa"},
            "user":{$first:"$user"}
        }},

    ]).exec()
    // let data = await reviewData.filter((rdata) => {
    //     return rdata.user!=null && rdata.villa!=null && rdata.villa.is_active==true
    // })
    return res.json({
        "status":true,
        "message":"Review Listed successfully",
        "data":reviewData
    })
}


module.exports.destRecentReview = async(req,res) => {
    let destination = req.body.destination
    let reviewData = await villaReviewModel.aggregate([
        {
            "$lookup":{
                "from":"villas",
                "localField":"villa",
                "foreignField":"_id",
                "as":"villainfo"
            }
        },
        {$unwind:"$villainfo"},
        {$match:{"destination":mongoose.Types.ObjectId(destination)}},
        {$sort:{createdAt:-1}},
        {$limit:10}
    ]).exec()

    return res.json({
        "status":true,
        "message":"review listed successfully",
        "data":reviewData
    })
}



module.exports.deleteReviewPermanently = async(req,res) => {
    const data = req.body
    const dData = await deleteData(reviewModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Review deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Review not found",
            "data":[]
        })
    }
}