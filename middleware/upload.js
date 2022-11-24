const path = require("path");
const multer = require("multer");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // console.log(file);
        // Uploads is the Upload_folder_name
        cb(null, "media");
    },
    filename: function (req, file, cb) {
        // console.log(file.originalname.split("."), "-upload files");
        // cb(null, file.fieldname + "-" + Date.now()+".jpg")
        if (file.originalname) {
            let check = file.originalname.split(".");
            if (check[1] == "svg") {
                cb(null, file.originalname);
            } else {
                cb(null, file.fieldname + "-" + Date.now() + ".jpg");
            }
        }
    },
});

const maxSize = 1048576; //file size

var upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
        // console.log(file, "data");
        // Set the filetypes, it is optional
        var filetypes = /jpeg|jpg|png|jfif|svg|webp/;
        var mimetype = filetypes.test(file.mimetype);

        var extname = filetypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(
            new Error(
                "Error: File upload only supports the " +
                    " jpeg jpg png jfif webp- "
            ),
            false
        );
    },

    // mypic is the name of file attribute
}); //.single("mypic");

module.exports = upload;
