const couponModel = require("../../models/info/couponModel");
const { validationResult } = require("express-validator")
var voucher_code = require("voucher-code-generator")
const bookModel = require("../../models/booking/bookModel");
const { deleteData } = require("../../lib/queryHelper");
module.exports.createCoupon = async(req,res) =>{
    var a = validationResult(req)
    
    if(!a.isEmpty()){
        return res.json({"error":a.array()[0].msg})
    }
    let data= req.body
    console.log(req.body)
    if(data.is_active=="Active"){
        data.is_active=true
    }
    else {
        data.is_active=false
    }
    if(data.id!=null) {
        updateCoupon(req,res)
    }
    else {
        var vCode = voucher_code.generate({length:8,count:2})
        if(data.coupon_code==""){
            console.log("------here come----------")
            data["coupon_code"]=vCode[0]
        }
        data["coupon_id"]=vCode[1]
    let cData = new couponModel(data)
    await cData.save((err,result) =>{
        if(!err){
            return res.json({
                "status":true,
                "message":"coupon created successfully",
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

module.exports.deleteCoupon = async(req,res) =>{
    let id = req.body.id
    let status=req.body.status
    if(id==null){
        return res.json({
            "status":false,
            "message":"coupon id is required",
            "data":[]
        })
    }
    let cData = await couponModel.findOneAndUpdate({_id:id},{$set:{is_active:!status}},{new:true})
    if(cData){
        return res.json({
            "status":true,
            "message":"coupon status updated succesfully",
            "data":cData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":'coupon not found',
            "data":[]
            
        })
    }
}



const updateCoupon = async(req,res) =>{
    var a = validationResult(req)
    if(!a.isEmpty()){
        return res.json({"error":a.array()[0].msg})
    }
    let id = req.body.id
    let data=req.body
    if(id==null){
        return res.json({
            "status":false,
            "message":"coupon id is required",
            "data":[]
        })
    }
    const isExist = await couponModel.exists({_id:{$ne:id},coupon_code:data.coupon_code})
    if(isExist){
        return res.json({
            "status":false,
            "message":"Coupon Code already exist",
            "data":[]
        })
    }
    couponModel.findOneAndUpdate({_id:id},data,{new:true},(err,result) => {
        if(!err){
            return res.json({
                "status":true,
                "message":"coupon is updated succesfully",
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






module.exports.getCoupon = async(req,res) =>{
    var cData = await couponModel.find({})
    return res.json({
        "status":true,
        "message":"coupon listed successfully",
        "data":cData
    })
}

module.exports.detailCoupon = async(req,res) =>{
    let id = req.body.id
    let status=req.body.status
    if(id==null){
        return res.json({
            "status":false,
            "message":"coupon id is required",
            "data":[]
        })
    }
    let cData = await couponModel.findOne({_id:id})
    if(cData){
        return res.json({
            "status":true,
            "message":"coupon detailed succesfully",
            "data":cData
        })
    }
    else {
        return res.json({
            "status":false,
            "message":'coupon not found',
            "data":[]
            
        })
    }
}


module.exports.validateCoupon = async(req,res) => {
    let coupon_code = req.body.coupon_code
    let userid = req.body.userid
    console.log("userid",userid)
    let date = new Date(req.body.date)
    let cData = await couponModel.findOne({coupon_code:coupon_code,is_active:true,end_date:{$gte:date},start_date:{$lte:date}})
    if (cData){
        let validCoupon = await bookModel.find({coupon:cData._id,user:userid}).count()
        console.log(validCoupon)
        console.log(cData)
        console.log("cData.coupon_limit_per_user",cData.coupon_limit_per_user)
        console.log("validCoupon.length",validCoupon+1)
        console.log("cData.coupon_limit_count<=cData.coupont_count+1",cData.coupont_count+1<=cData.coupon_limit_count)
        console.log("parseInt(cData.coupon_limit_per_user) <= validCoupon+1 ",parseInt(cData.coupon_limit_per_user) <= validCoupon+1 )
        if(cData.coupon_limit_per_user<=validCoupon){
            return res.json({
                "status":false,
                "message":"You have used coupon more than limit",
                "data":[]
            })
        }
        if((cData.coupont_count+1<=cData.coupon_limit_count) ){
            return res.json({
                "status":true,
                "message":"Coupon Code is Valid",
                "data":cData
            })
        }
        else {
            return res.json({
                "status":false,
                "message":"Applied coupon limit are ended",
                "data":[]
            })
        }

    }

    else {
        return res.json({
            "status":false,
            "message":"Invalid Coupon Code",
            "data":[]
        })
    }
}

module.exports.deleteCouponPermanently = async(req,res) => {
    const data = req.body
    const dData = await deleteData(couponModel,data)
    if(dData.status){
        return res.json({
            "status":true,
            "message":"Coupon deleted successfully",
            "data":dData.data
        })
    }
    else {
        return res.json({
            "status":false,
            "message":"Coupon not found",
            "data":[]
        })
    }
}