const user = require("../../models/accounts/userModel")
const notifyModel = require("../../models/notifications/notifyModel")
const sendNotification = require("../../controllers/notification/notify")
const villaModel = require("../../models/info/villaModel")
module.exports.showNotification = async(req,res) =>{
    var  id = req.user.id
    var uData = await user.findOne({_id:id})
    var notifyData= await notifyModel.find({user:uData._id}).sort({createdAt:-1})
    return res.json({
        "status":true,
        "message":"notification listed succesfully",
        "data":notifyData
    })
    

}


module.exports.notifyHost = async(id,check_in_date,check_out_date)=>{
    let villa = await villaModel.findOne({_id:id}).populate([{path:'host',select:{email:1,fcm_token:1}}])
    // console.log('villa:', villa);
    let token = villa.host.fcm_token
    let title = `Villa Booked`
    let body = `${villa.villa_name} is booked by ${villa.host.email} from ${check_in_date} to ${check_out_date}`
    
    let data = {
        user:villa.host._id,
        fcmtoken:token,
        title:title,
        body:body
    }
    let notifyData = new notifyModel(data)
    await notifyData.save((err,result)=>{
        if(!err){
            sendNotification(token,title,body)
            console.log("Data saved..")
        }
        else{
            console.log("something went wrong",err)
        }
    })

}
// this.notifyHost("60d9c188875ea918743aabaf")
// notifyToHost("60d9c188875ea918743aabaf")
// module.exports.notifytoHost = async(villa_id) =>{
//     var title = "Villa is Booked"
//     var body=""
    
//     var user = await venueModel.aggregate([
//         {$match:{_id:mongoose.Types.ObjectId(villa_id)}},

//         {
//             "$lookup":{
//                 "from":"venues",
//                 "localField":"venue",
//                 "foreignField":"_id",
//                 "as":"venuinfo"
//             }
//         },
//         {$unwind:"$venuinfo"},
//         {
//             "$lookup":{
//                 "from":"users",
//                 "localField":"venuinfo.service_provider",
//                 "foreignField":"_id",
//                 "as":"serviceinfo"
//             }
//         }
       
       
//     ]).exec()
 
//     var s=user[0]
//     if(s.serviceinfo.length>0){
//         var sid = s.serviceinfo[0]
//     var notifyData = new notify({user:sid._id,title:title,body:body})
//     notifyData.save((err,result) => {})
//     console.log("send notification")
//     sendNotification(sid.fcm_token,title,body)
//     }
    
// }