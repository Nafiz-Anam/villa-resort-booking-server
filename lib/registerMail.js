const nodemailer = require("nodemailer");
const { env } = require("../config/config");

module.exports.sendRegisterMail = async (req, res, email, name) => {
    console.log("email user => ", email);
    console.log("user name => ", name);

    var number = Math.floor(Math.random() * 90000) + 10000;
    console.log("otp code =>", number);

    var name = name;
    var to = email;

    // added send-pulse connection
    var smtpTransport = nodemailer.createTransport({
        host: "smtppro.zoho.in",
        port: 465,
        secure: true,
        auth: {
            user: env.email,
            pass: env.password,
        },
    });

    const htmlTemplate = `
    <html>
    <body>
    <p>${`Dear ${name}, Your secret OTP is ${number} for login/register at LEESTAYS. Valid only for 5 minutes.`}</p>
    </body>
    </html>
  `;

    var mailOptions = {
        from: env.email,
        to: to,
        subject: "Your Registration OTP",
        text: `Dear ${name}, Your secret OTP is ${number} for login/register at LEESTAYS. Valid only for 3 minutes.`,
        html: htmlTemplate,
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log("sending mail error =>", error);
        } else {
            return res.json({
                status: true,
                message: "Mail is sent to user email address",
                data: [],
            });
        }
    });

    return number;
};
