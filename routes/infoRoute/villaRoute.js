const villaController = require("../../controllers/info/villaController")
const blogController = require("../../controllers/info/blogController");
const destController = require("../../controllers/info/destinationController");
const couponController = require("../../controllers/info/couponController");
const villaReviewController = require("../../controllers/info/reviewController");
const questionController = require("../../controllers/info/questionController");
const bookMarkController = require("../../controllers/info/bookMarkController");
const ratingController = require("../../controllers/info/ratingController");
const amenityController = require("../../controllers/info/amenityController")
const loginmiddleware = require("../../middleware/loginMiddleware");
const adminMiddleware = require("../../middleware/adminMiddleware");


const upload = require("../../middleware/upload");
const multer = require("multer")
const router = require("express").Router();

//Villa
// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         console.log(file,"come")
//       cb(null, 'media')
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.fieldname + '-' + Date.now())
//     }
//   })
   
//   var upload = multer({ storage: storage })

const use = fn => (req,res,next) => {
    
    Promise.resolve(fn(req,res,next)).catch(next);
}

router.post("/view",upload.any('bannerImg'),villaController.createVilla);

// for admin
router.get("/view/admin",adminMiddleware,villaController.getadminVilla);
router.post("/view/filter/admin/villa",villaController.filterVilla)
router.get("/view/active",villaController.getActiveVilla)

// frontend
router.get("/view/:limit",villaController.getVilla);
router.post("/view/detail",villaController.detailVillaAdmin)
router.post("/view/detail/user",villaController.detailVilla)

router.post("/filter",villaController.searchVilla)
router.delete("/view",villaController.deleteVilla)

router.post("/view/similar",villaController.similarVilla)
router.post("/view/destination",use(villaController.getDestinationVilla))

//validate villa
router.post("/view/validate",villaController.validateVilla)
//get booked date
router.post("/view/get/booked/date",villaController.getBookedDate)

// Blog 
router.get("/blog/view",blogController.getblog);
router.post("/blog/view",upload.single('blog_image'),blogController.createBlog);
// router.put("/blog/view",blogController.updateBlog);
router.post("/blog/detail",blogController.detailBlog);
router.delete("/blog/view",blogController.deletBlog);

router.get("/blog/active",blogController.getActiveBlog)

router.post("/blog/front",blogController.getBlogFrontBlog)
//destination

router.get("/dest/view",destController.get)
router.get("/dest/view/admin",destController.getAdminDest)

router.post("/dest/view",upload.single('destination_img'),destController.create)
router.post("/dest/detail",destController.detail)
router.delete("/dest/view",destController.delete)

// coupon

router.post("/coupon/view",couponController.createCoupon)
router.get("/coupon/view",couponController.getCoupon)
router.post("/coupon/view/detail",couponController.detailCoupon)
router.delete("/coupon/view",couponController.deleteCoupon)

router.post("/coupon/validate",couponController.validateCoupon)

//review

router.post("/review/view",use(villaReviewController.create))
router.get("/review/view",use(villaReviewController.getAllReview))
router.post("/review/by/villa",use(villaReviewController.getVillaReview))
router.post("/review/approve",use(villaReviewController.approveReview))
router.post("/review/detail",use(villaReviewController.detailReview))
router.get("/review/recent",use(villaReviewController.recentReview))
router.post("/review/destination",use(villaReviewController.recentReview))

// questionAnswer

router.post("/question/view",use(questionController.create))
router.post("/question/update",use(questionController.updateQuestion))
router.get("/question/view",use(questionController.getQuestion))
router.delete("/question/view",use(questionController.deleteQuestion))
router.post("/question/detail",use(questionController.detailQuestion))

router.get("/question/active",use(questionController.getActiveQuestion))


//Bookmark
router.post("/bookmark/view",loginmiddleware,use(bookMarkController.create))
router.post("/bookmark/check",loginmiddleware,use(bookMarkController.getBookMark))
router.post("/bookmark/remove",loginmiddleware,use(bookMarkController.removedBookmark))


//Rating

router.post("/addrating",loginmiddleware,use(ratingController.addRating))
router.post("/userrating",loginmiddleware,use(ratingController.getUserRating))
router.post("/getrating",use(ratingController.getRating))

// amenities 
router.post("/addamenity",upload.single('amenity_image'),use(amenityController.addAmenity))
router.post("/updateamenity",upload.single('amenity_image'),use(amenityController.updateAmenity))
router.get("/getamenity",use(amenityController.getAllAmenities))
router.post("/deleteamenity",use(amenityController.deletAmenity))
router.post("/eminity/detail",use(amenityController.amenityDetail))
router.get("/get/active/amenity",use(amenityController.getActiveAmenities))


// delete images 


router.post("/delete/villa/images",villaController.removeImage)

router.post("/delete/permanent/review",villaReviewController.deleteReviewPermanently)
router.post("/delete/permanent/villa",villaController.deleteVillaPermanently)
router.post("/delete/permanent/blog",blogController.deleteBlogPermanently)
router.post("/delete/permanent/amenity",amenityController.deleteAmenityPermanently)
router.post("/delete/permanent/question",questionController.deleteQuetionPermanently)
router.post("/delete/permanent/coupon",couponController.deleteCouponPermanently)
router.post("/delete/permanent/destination",destController.deleteDestinationPermanently)





module.exports=router