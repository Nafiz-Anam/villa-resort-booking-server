const { deleteData } = require("../../lib/queryHelper")
const questionModel = require("../../models/info/questionModel")

module.exports.create = async(req,res) => {
    let data = req.body
    let qData = new questionModel(data)
    await qData.save((err,result) =>{
        if(!err){
            return res.json({
                "status":true,
                "message":"Question Saved Successfully",
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


module.exports.getQuestion = async(req,res) => {
    let qData = await questionModel.find({})
    if(qData){
        return res.json({
            "status":true,
            "message":"Question listed successfully",
            "data":qData
        })
    }
}


module.exports.updateQuestion = async(req,res) =>{
    let id = req.body.id
    if(id==null){
        return res.json({
            "status":false,
            "message":"question id is required",
            "data":[]
        })
    }
    else {
        let data = req.body
        let bData = await questionModel.findOneAndUpdate({_id:id},data,{new:true})
        if(bData){
            return res.json({
                "status":true,
                "message":"question is updated successfully",
                "data":bData
            })
        }
        else {
            return res.json({
                "status":false,
                "message":"something went wrong",
                "data":[]
            })
        }
    }
}


module.exports.deleteQuestion = async(req,res) => {
    let id = req.body.id
    let status = req.body.status
    console.log(req.body)
    if(id==null){
        return res.json({
            "status":false,
            "messasge":"Id is required",
            "data":[]
        })
    }
    // else if(status!=true || status!=false){
    //     return res.json({
    //         "status":false,
    //         "message":"status must be true or false",
    //         "data":[]
    //     })
    // }
    else {
        let bData = await questionModel.findOneAndUpdate({_id:id},{$set:{is_active:status}},{new:true})
        if(bData){
            return res.json({
                "status":true,
                "message":"question status is updated successfully",
                "data":bData
            })
        }
    }
}


module.exports.detailQuestion = async(req,res) => {
    let id = req.body.id
    if(id==null){
        return res.json({
            "status":false,
            "message":"question id is required",
            "data":[]
        })
    }

    let qData = await questionModel.findOne({_id:id})
    if(qData){
        return res.json({
            "status":true,
            "message":"Question Detailed Successfully",
            "data":qData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Question is not found",
            "data":[]
        })
    }
}



module.exports.getActiveQuestion = async(req,res) => {
    let qData = await questionModel.find({is_active:true})
    return  res.json({
        "status":true,
        "message":"Question listed succesfully",
        "data":qData
    })
}


module.exports.deleteQuetionPermanently = async(req,res) => {
    const data = req.body
    const dData = await deleteData(questionModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Question deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Question not found",
            "data":[]
        })
    }
}