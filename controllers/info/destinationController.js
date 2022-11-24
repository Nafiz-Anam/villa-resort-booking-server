const { deleteData } = require("../../lib/queryHelper");
const destinationModel = require("../../models/info/destinationModel");

module.exports.create = async(req,res) => {
    var data =req.body
    console.log(req.body)
    if(data.dest_id!=null){
        console.log(req.file)
        if (req.file) {
            var k = "media/" + req.file.filename
            data["destination_img"]=k
        }

        var destData =  destinationModel.findOneAndUpdate({_id:data.dest_id},data,(err,result) => {
            if(!err){
                return res.json({
                    "status":true,
                    "message":"destination updated succefully",
                    "data":result
                })
            }
            else {
                return res.json({
                    "status":false,
                    "message":"Destination already registered",
                    "data":[]
                })
            }
        })
    }
    else {
        if (req.file) {
            var k = "media/" + req.file.filename
            data["destination_img"]=k
        }
        var destData = new destinationModel(data)

        await destData.save((err,result) => {
            if(!err){
                return res.json({
                    "status":true,
                    "message":"destination created succefully",
                    "data":result
                })
            }
            else {
                return res.json({
                    "status":false,
                    "message":"Destination already registered",
                    "data":[]
                })
            }
        })
    }
}
 

module.exports.get = async(req,res) => {
    var destData = await destinationModel.find({is_active:true})
    return res.json({
        "status":true,
        "message":"destination listed successfully",
        "data":destData
    })
}

module.exports.getAdminDest = async(req,res) => {
    var destData = await destinationModel.find({})
    return res.json({
        "status":true,
        "message":"destination listed successfully",
        "data":destData
    })
}


module.exports.detail = async(req,res) => {
    console.log(req.body)
    var destData = await destinationModel.findOne({_id:req.body.dest_id})
    return res.json({
        "status":true,
        "message":"destination listed successfully",
        "data":destData
    })
}

module.exports.delete = async(req,res) => {
    var data = req.body
    
    var destData = await destinationModel.findOneAndUpdate({_id:data.dest_id},{$set:{is_active:!data.status}},{new:true})
    if(destData){
        return res.json({
            "status":true,
            "message":"Destination Status updated successfully",
            "data":destData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Something went wrong",
            "data":[]
        })
    }
}

module.exports.deleteDestinationPermanently = async(req,res) => {
    const data = req.body
    console.log(data)
    const dData = await deleteData(destinationModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Destination deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Destination not found",
            "data":[]
        })
    }
}