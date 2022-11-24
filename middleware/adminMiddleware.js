const jwt = require("jsonwebtoken")
const {env} = require("../config/config")

const isAuthenticated = async(req,res,next) => {
    
    // var t = req.headers.authorization
    var t = req.session.token
    console.log(t)
    if(t==undefined){
        res.redirect('/view/login')
    }
    
    jwt.verify(t,env.secrete,(err,decode) => {
        if(err) {
            console.log("error ", err)
            return res.json({
                "status":false,
                "message":"token is expire",
                "data":[]
            })
        }
        req.user = decode
        // next();
    })
    if(req.user) {
        
        next();

    }
    else {
        
        return res.redirect("/view/login")
    }
}


module.exports = isAuthenticated