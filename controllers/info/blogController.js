const { validationResult } = require("express-validator")
const { deleteData } = require("../../lib/queryHelper")
const blogModel  = require("../../models/info/blogModel")

module.exports.createBlog = async(req,res) =>{
    var a = validationResult(req)
    
    if(!a.isEmpty()){
        return res.json({"error":a.array()[0].msg})
    }
    var data =req.body
    
    if(data.id!="null"){
        updateBlog(req,res)
    }

    else {
    
    // let filelist=[]
    // for(var i in req.files){
    //     var k = "media/" + req.files[i].filename
    //     filelist.push(k)
    // }
    if(req.file){
        data["blog_image"]="media/" + req.file.filename

    }
    data["blog_id"]=Math.random().toString(36).slice(2)
    var bData  = new blogModel(data)   
    await bData.save((err,result)=> {
        if(!err) {
            return res.json({
                "status":true,
                "message":"blog saved succesfully",
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
}

module.exports.getblog = async(req,res) => {
    var bData =  await blogModel.find({})
    return res.json({
        "status":true,
        "message":"Blog listed succesfully",
        "data":bData
    })
}



module.exports.detailBlog = async(req,res) =>{
    var id =req.body.id.trim()
    
    if(id==null){
        return res.json({
            "status":false,
            "message":"blod id is required",
            "data":[]
        })
    }
    var bData = await blogModel.findOne({_id:id})
    if(bData){
        return res.json({
            "status":true,
            "message":"blog detailed succesfully",
            "data":bData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"blog not found",
            "data":[]
        })
    }
}
const updateBlog = async(req,res) =>{
    var a = validationResult(req)
    
    if(!a.isEmpty()){
        return res.json({"error":a.array()[0].msg})
    }
    var id =req.body.id.trim();
    var data= req.body
    if(id==null){
        return res.json({
            "status":false,
            "message":"blod id is required",
            "data":[]
        })
    }
    delete data.blog_image
    
    if(req.file){
        data["blog_image"]="media/" + req.file.filename

    }
    var bData = await blogModel.findOneAndUpdate({_id:id},data,{new:true})
    if(bData){
        return res.json({
            "status":true,
            "message":"blog updated  succesfully",
            "data":bData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"blog not found",
            "data":[]
        })
    }   
}

module.exports.deletBlog = async(req,res) =>{
    var id =req.body.id
    var status= req.body.status
    if(id==null){
        return res.json({
            "status":false,
            "message":"blod id is required",
            "data":[]
        })
    }
    var bData = await blogModel.findOneAndUpdate({_id:id},{$set:{is_active:!status}},{new:true})
    if(bData){
        return res.json({
            "status":true,
            "message":"blog updated  succesfully",
            "data":bData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"blog not found",
            "data":[]
        })
    }   
}




module.exports.getActiveBlog = async(req,res) =>{
    let bData = await blogModel.find({is_active:true}).limit(10).sort({createdAt:-1})
    return res.json({
        "status":true,
        "message":"Blog Listed Successfully",
        "data":bData
    })

}


module.exports.getBlogFrontBlog = async(req,res) => {
    let limit = 5
    let page = parseInt(req.body.page)*limit
    let count = await blogModel.find({is_active:true}).count()
    let bData = await blogModel.find({is_active:true}).limit(5).skip(page).sort({createdAt:-1})
    return res.json({
        "status":true,
        "message":"Blog Listed Successfully",
        "data":bData,
        "count":count
        
    })
}

module.exports.deleteBlogPermanently = async(req,res) => {
    const data = req.body
    const dData = await deleteData(blogModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Blog deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Blog not found",
            "data":[]
        })
    }
}