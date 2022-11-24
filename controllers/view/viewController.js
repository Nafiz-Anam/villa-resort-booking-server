
// module.exports.dashboard = async(req,res) =>{
//     res.render("new_b2play/nsdbytes.com/template/oculux/html/index")
// }
module.exports.dashboard = async(req,res) =>{
    res.render("html/index")
}

module.exports.villa = async(req,res) =>{
    res.render("html/villa")
}
module.exports.add_villa = async(req,res) =>{
    res.render("html/add_villa")
}

module.exports.villa_detail = async(req,res) =>{
    res.render("html/villa_details")
}
module.exports.edit_villa = async(req,res) =>{
    res.render("html/edit_villa")
}


module.exports.host = async(req,res) =>{
    res.render("html/host")
}

module.exports.add_blog = async(req,res) =>{
    res.render("html/add_blog")
}
module.exports.blog = async(req,res) =>{
    res.render("html/blogs")
}
module.exports.blog_edit = async(req,res) =>{
    res.render("html/edit_blog")
}
module.exports.bookvilla = async(req,res) =>{
    res.render("html/booking")
}

module.exports.booking_detail=async(req,res) => {
    res.render("html/booking_details")
}

module.exports.edit_booking=async(req,res) => {
    res.render("html/edit_booking")
}

module.exports.coupons=async(req,res) => {
    res.render("html/coupons")
}


module.exports.app_calender=async(req,res) => {
    res.render("html/app-calendar")
}
module.exports.destination=async(req,res) => {
    res.render("html/add_dest")
}

module.exports.review=async(req,res) => {
    res.render("html/review")
}

module.exports.questions=(req,res) => {
    res.render("html/question")
}

module.exports.login = (req,res) => {
    res.render("html/login",{"notify":""})
}

module.exports.logout = async(req,res) => {
    
    req.session.destroy((err) => {
        
        res.redirect('/view/login') // will always fire after session is destroyed
      })

}

module.exports.getHostVilla = (req,res) => {
    res.render("html/host_villa_list")
}

module.exports.rating = (req,res) => {
    res.render("html/rating")
}
module.exports.amenities = (req,res) => {
    res.render("html/amenities")
}