const bookMarkModel = require("../../models/info/bookMarkModel")


module.exports.create = async(req,res) => {
    let data = req.body
     data["user"]=req.user.id
    let bData = new bookMarkModel(data)
    await bData.save((err,result) => {
        if(!err){
            return res.json({
                "status":true,
                "message":"Bookmark created succesfully",
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



module.exports.getBookMark= async(req,res) => {
    let user = req.user.id
    let villa=req.body.villa
    if(villa==null){
        return res.json({
            "status":false,
            "message":"villa id is required",
            "data":[]
        })
    }
    else {
        let bData = await bookMarkModel.findOne({user:user,villa:villa})
        if(bData){
            return res.json({
                "status":true,
                "message":"bookmark is listed",
                "data":bData
            })
        }
        else {
            return res.json({
                "status":false,
                "message":"villa is not bookmarkd",
                "data":[]
            })
        }
    }
}


module.exports.removedBookmark = async(req,res) => {
    villa = req.body.villa,
    user = req.user.id
    
    if(villa==null){
        return res.json({
            "status":false,
            "message":"villa is required",
            "data":[]
        })
    }
    else{
        let bData = await bookMarkModel.deleteOne({user:user,villa:villa})
        if(bData){
            return res.json({
                "status":true,
                "message":"bookmark is removed",
                "data":bData
            })
        }
        else {
            return res.json({
                "status":false,
                "message":"bookmark is not found",
                "data":[]
            })
        }
    }
}