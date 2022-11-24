const villaController = require("../../controllers/info/villaController")

const viewController = require("../../controllers/view/viewController")
const router = require("express").Router()

router.get("/dashboard",viewController.dashboard)
router.get("/villa",viewController.villa)
router.get("/addvilla",viewController.add_villa)
router.get("/villa_details",viewController.villa_detail)
router.get("/edit_villa",viewController.edit_villa)

router.get("/host",viewController.host)
router.get("/addblog",viewController.add_blog)
router.get("/blogs",viewController.blog)
router.get("/blog_edit",viewController.blog_edit)


router.get("/booking",viewController.bookvilla)
router.get("/edit_booking",viewController.edit_booking)
router.get("/booking_details",viewController.booking_detail)

router.get('/coupons',viewController.coupons)
router.get('/app-calendar',viewController.app_calender)
router.get('/destination',viewController.destination)
router.get('/review',viewController.review)

router.get('/questions',viewController.questions)
router.get('/login',viewController.login)
router.get('/logout',viewController.logout)
router.get('/host_villa_list',viewController.getHostVilla)
    
router.get('/rating',viewController.rating)
router.get('/amenities',viewController.amenities)
module.exports=router