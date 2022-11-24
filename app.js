const express = require("express");
const cors = require("cors");
var session = require("express-session");
const mongoose = require("mongoose");
const { env } = require("./config/config");

const app = express();
// app.options("*", cors());

app.use(cors());

const path = require("path");
const accountRoute = require("./routes/accountRoute/userRoute");
const viewRouter = require("./routes/viewRoute/viewroute");
const villRouter = require("./routes/infoRoute/villaRoute");
const bookRouter = require("./routes/bookRoute/bookRoute");
const hostRouter = require("./routes/hostRoute/hostRoute");

const bodyParser = require("body-parser");

var dir = path.join(__dirname, "/public");
var media = path.join(__dirname, "/media");

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.locals.baseURL = env.server_url;

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static(dir));
app.use("/media", express.static(media));

app.use(
    session({
        key: "user_sid",
        secret: "this is secrete",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60000000,
        },
    })
);

const use = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

app.use(
    use(function (req, res, next) {
        next();
    })
);
app.use("/accounts", accountRoute);
app.use("/villa", villRouter);
app.use("/book", bookRouter);
app.use("/host", hostRouter);

app.use(function (req, res, next) {
    var user_id = req.session.token;

    if (req.session.isLoggedIn) {
        app.locals.user_id = req.session.token;
        app.locals.email = req.session.email;
        app.locals.admin_id = req.session.admin_id;

        return next();
    } else {
        // return next();
        // res.render('/view/login/superadmin')

        res.render("html/login", { notify: "" });
        // req.url = "/view/login/superadmin";
    }
});

app.use("/view", viewRouter);
try {
    mongoose.connect(
        env.mongoURL,

        (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("database connected ..");
            }
        }
    );
} catch (e) {
    console.log(e);
}

app.use(function (err, req, res, next) {
    console.log(err.message);
    let er = new Error(err.message);
    res.json({
        status: false,
        message: err.message,
        data: [],
    });
});

app.get("/", (req, res) => res.redirect("/view/dashboard"));
app.listen(env.port, () => console.log(`Example app listening on port: 5050`));
