const bcrypt = require("bcrypt")
const adminModel = require("../../models/accounts/adminModel")

const jwt = require("jsonwebtoken")
const {env} = require("../../config/config")

const authtoken= (email,id) => {
    return jwt.sign({email:email,admin_id:id},env.secrete,{expiresIn:env.token_expire});

}
module.exports.adminLogin = async(req,res) => {
    let email = req.body.email
    let p = req.body.password
    console.log(req.body,"body")
    
    let user = await adminModel.findOne({email:email})
    if(user){
        let check = bcrypt.compareSync(p,user.password)
        if(check){
            var token = await authtoken(user.email,user._id)
            console.log(token,"token")
            req.session["token"] = token
            req.session.isLoggedIn = true

            req.session.email = user.email
            req.session.admin_id = user._id

            await adminModel.findOneAndUpdate({email:email},{$set:{token:token}},{new:true})
            console.log(req.session)
            return res.redirect("/view/dashboard")
            // return res.json({
            //     "status":true,
            //     "message":"User login successfully",
            //     "data":[]
            // })
        
        }
        else {
            return res.redirect("html/login",{"notify":"Invalid Credential"})
                
            // return res.json({
            //     "status":false,
            //     "message":"Invalid credential",
            //     "data":[]
            // })
        }

    
    }
    else {
        return res.render("html/login",{"notify":"Enter Valid Credential"})

        // return res.json({
        //     "status":false,
        //     "message":"Invalid credential",
        //     "data":[]
        // })
    }

}



module.exports.changePassword = async(req,res) =>{
    let data = req.body
    if(data.old_password==null){
        obj.message="old password is required"       
        return res.json(obj)
    }
    else if(data.new_password==null){
        obj.message="new password is required"
        return res.json(obj)
    }
    else {
        let email=req.body.email
        let user = await adminModel.findOne({email:email})
        if(user) {
            let check = bcrypt.compareSync(data.old_password,user.password)
            if(check){
                let p = bcrypt.hashSync(data.new_password,10)
                let uData= await adminModel.findOneAndUpdate({email:email},{$set:{password:p}},{new:true})
                return res.json({
                    "status":true,
                    "message":"Password is updated",
                    "data":uData
                })
            }
            else {
                return res.json({
                    "status":false,
                    "message":"Old password is incorrect",
                    "data":[]
                })
            }
        }
        else {
            return res.json({
                "status":false,
                "message":"User not found",
                "data":[]
            })
        }

    }
}

module.exports.createAdmin = async(req,res) => {
    let email =req.body.email
    let p = req.body.password
    let data =req.body
    const hash = bcrypt.hashSync(p, 10);
    data.password = hash   
    let uData = new adminModel(data)
    await uData.save((err,result) => {
        if(!err){
            return res.json({
                "status":true,
                "message":"admin created successfullly",
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