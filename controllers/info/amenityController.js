const { deleteData } = require("../../lib/queryHelper")
const amenityModel = require("../../models/info/amenitiesModel")
module.exports.addAmenity = async(req,res) => {
    let data = req.body
    if(req.file){
        data["amenity_image"]="media/" + req.file.filename

    }
    let amenityData = amenityModel(data)
    amenityData.save((err,result) => {
        if(!err){
            return res.json({
                "status":true,
                "message":"Amenity registered successfully",
                "data":result
            })
        }
        else {
            return res.json({
                "status":false,
                "message":err.message,
                "data":[]
            })
        }
    })
}

module.exports.updateAmenity = async(req,res) => {
    let id =req.body.id
    let data = req.body
    console.log(data,"amenity")
    if(!id){
        return res.json({
            "status":false,
            "message":"Amenity id is required",
            "data":[]
        })
    }
    if(req.file){
        data["amenity_image"]="media/" + req.file.filename

    }
    let updateData = await amenityModel.findOneAndUpdate({_id:id},data,{new:true})

    if(updateData){
        return res.json({
            "status":true,
            "message":"Amenity is updated",
            "data":updateData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Amenity not found",
            "data":[]
        })
    }
}

module.exports.getAllAmenities = async(req,res) => {
    let data = await amenityModel.find({})
    return res.json({
        "status":true,
        "message":"Amenities are listed successfully",
        "data":data
    })
}


module.exports.deletAmenity = async(req,res) =>{
    console.log(req.body)
    var id =req.body.id
    var status= req.body.status
    if(id==null){
        return res.json({
            "status":false,
            "message":"Amenity id is required",
            "data":[]
        })
    }
    var bData = await amenityModel.findOneAndUpdate({_id:id},{$set:{is_active:!status}},{new:true})
    if(bData){
        return res.json({
            "status":true,
            "message":"Amenity status change  succesfully",
            "data":bData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Amentiy not found",
            "data":[]
        })
    }   
}

module.exports.amenityDetail = async(req,res) =>{
    let id = req.body.id
    if(!id){
        return res.json({
            "status":false,
            "message":"Id is required",
            "data":[]
        })
    }
    let data = await amenityModel.findOne({_id:id})
    if(data){
        return res.json({
            "status":true,
            "message":"Amenity detailed successfully",
            "data":data
        })
    }
}

module.exports.getActiveAmenities = async(req,res) =>  {
    let amenityData = await amenityModel.find({is_active:true})
    return res.json({
        "status":true,
        "message":"Amenities Listed Successfully",
        "data":amenityData
    })
}



module.exports.deleteAmenityPermanently = async(req,res) => {
    const data = req.body
    const dData = await deleteData(amenityModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Amenity deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Ameinty not found",
            "data":[]
        })
    }
}