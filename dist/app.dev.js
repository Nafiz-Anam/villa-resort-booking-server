"use strict";

var express = require("express");

var app = express();

var session = require("express-session");

var _require = require("./config/config"),
    env = _require.env;

var mongoose = require("mongoose");

var cors = require("cors");

var path = require("path");

var accountRoute = require("./routes/accountRoute/userRoute");

var viewRouter = require("./routes/viewRoute/viewroute");

var villRouter = require("./routes/infoRoute/villaRoute");

var bookRouter = require("./routes/bookRoute/bookRoute");

var hostRouter = require("./routes/hostRoute/hostRoute");

var bodyParser = require("body-parser");

app.use(cors());
var dir = path.join(__dirname, "/public");
var media = path.join(__dirname, "/media");
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.locals.baseURL = "http://127.0.0.1:5050"; // app.locals.baseURL = "http://172.105.47.14:5050";

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express["static"](dir));
app.use("/media", express["static"](media));
app.use(session({
  key: "user_sid",
  secret: "this is secrete",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 60000000
  }
}));

var use = function use(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next))["catch"](next);
  };
};

app.use(use(function (req, res, next) {
  next();
}));
app.use("/accounts", accountRoute);
app.use("/villa", villRouter);
app.use("/book", bookRouter);
app.use("/host", hostRouter);
app.use(function (req, res, next) {
  var user_id = req.session.token;

  if (req.session.isLoggedIn) {
    app.locals.user_id = req.session.token;
    app.locals.email = req.session.email;
    return next();
  } else {
    // res.render('/view/login/superadmin')
    res.render("html/login", {
      notify: ""
    }); // req.url = "/view/login/superadmin";
  }
});
app.use("/view", viewRouter);
mongoose.connect(env.mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true // useCreateIndex: true,

}, function (error) {
  if (error) {
    console.log(error);
  } else {
    console.log("database connected ..");
  }
});
app.use(function (err, req, res, next) {
  console.log(err.message);
  var er = new Error(err.message);
  res.json({
    status: false,
    message: err.message,
    data: []
  });
});
app.get("/", function (req, res) {
  return res.send("Hello World!");
});
app.listen(env.port, function () {
  return console.log("Example app listening on port port!");
});