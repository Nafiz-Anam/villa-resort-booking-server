const ratingModel = require("../../models/info/ratingModel");
const mongoose = require("mongoose");
const villaModel = require("../../models/info/villaModel");
const { deleteData } = require("../../lib/queryHelper");


module.exports.addRating = async(req,res) => {
    let data = req.body
    
    let rData = new ratingModel(data)
    let checkRating = await ratingModel.exists({user:req.user.id,rating_type:data.rating_type,villa:req.body.villa})
    if(checkRating){
        return res.json({
            "status":false,
            "message":"Rating is already added",
            "data":[]
        })
    }
    await rData.save(async(err,result) => {
        if(!err){
            let data = await this.getVillaRating(result.villa)
            if(data){
                await villaModel.findOneAndUpdate({_id:result.villa},{$set:{villa_rating:data.totalRating,total_rating:data.count}},{new:true})
            }
            return res.json({
                "status":true,
                "message":"Rating added successfully",
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

module.exports.getUserRating = async(req,res) => {
    let villa = req.body.villa
    if(villa==null){
        return res.json({
            "status":false,
            "message":"villa id is required",
            "data":[]
        })
    }
    let ratingData = await ratingModel.aggregate([
        {$match:{villa:mongoose.Types.ObjectId(villa),user:mongoose.Types.ObjectId(req.user.id)}},
        {
        "$group":{
            "_id":"$user",
            "rating":{"$push":"$$ROOT"}
           
            }    
        }
    ]).exec()
    return res.json({
        "status":true,
        "message":"rating fetch successfully",
        "data":ratingData[0]
    })
}

module.exports.getVillaRating = async(villa) => {
    let count = await ratingModel.find({villa:villa}).count()
        let rData = await ratingModel.aggregate([
            {$match:{villa:mongoose.Types.ObjectId(villa)}},
            {
                $group:{
                    "_id":"$rating_type",
                    "rating_type":{"$first":"$rating_type"},
                    "avg":{$avg:"$rating"}

                }
            }
        ]).exec()
        let data={}
        if(rData.length>0) {
            
            let avgrating = await rData.reduce((a,b)=>{
                // console.log(a)
                return parseInt(a)+parseInt(b.avg)
            },0)
            data["rating"]=rData
            data["totalRating"]=avgrating/5
            data["count"]=count
            return data
        }
        else {
           data["rating"]=[]
            data["totalRating"]=0
            data["count"]=0
            return data
        }
    
}

module.exports.getRating = async(req,res) => {
    let villa = req.body.villa
    if(villa==null){
        return res.json({
            "status":false,
            "message":"villa id required",
            "data":[]
        })
    }
    else {
        let data = await this.getVillaRating(villa)
        
        if(!Array.isArray(data)) {
            // await villaModel.findOneAndUpdate({_id:villa},{$set:{villa_rating:data.totalRating,total_rating:data.count}},{new:true})
            
        return res.json({
            "status":true,
            "message":"rating detailed successfully",
            "data":data,
        })
        }
        // else {
        //     return res.json({
        //         "status":false,
        //         "message":"rating is not found",
        //         "data":{"rating":[],"totalRating":0,"count":0}
        //     })
        // }
    }

        
    
    
}


module.exports.deleteRatingPermanently = async(req,res) => {
    const data = req.body
    const dData = await deleteData(ratingModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Rating deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Rating not found",
            "data":[]
        })
    }
}