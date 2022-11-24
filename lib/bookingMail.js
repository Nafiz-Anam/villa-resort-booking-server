const nodemailer = require("nodemailer");
const { env } = require("../config/config");
const moment = require("moment");
const { timeConvert } = require("./time-convert");

module.exports.bookingMail = async (req, res, email, name, mailData) => {
    console.log("email user => ", email);
    console.log("user name => ", name);
    var name = name;
    var to = email;

    // added zoho mail connection
    var smtpTransport = nodemailer.createTransport({
        host: "smtppro.zoho.in",
        // host: "smtp-pulse.com",
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
    <h2>Your Booking ${mailData?.booking_id} is confirmed with Leestays </h2>
    <h3> Property Name: ${mailData?.villa_name} </h3>
    <h4>
    Check-in date: ${moment(mailData?.check_in_date).format("DD-MM-YYYY")}   
    </h4>
    <h4>
    Check-in time: ${timeConvert(mailData?.check_in_time)}
    </h4>
    </br> </br>
    <h4>
    Check-out date: ${moment(mailData?.check_out_date).format("DD-MM-YYYY")}
    </h4>
    <h4>
    Check-out time: ${timeConvert(mailData?.check_out_time)}
    </h4>
    <h4>
    <img src=${`cid:unique@kreata.ee`}> </img>
    </h4>
    <h4>
    Booking status: ${mailData?.booking_status}
    </h4>
    <h4>
    Adults: ${mailData?.adult}
    </h4>
    <h4>
    Children: ${mailData?.children}
    </h4>
    <h4>
    Infants: ${mailData?.infants}
    </h4>
    <h4>
    Final booking price: ₹${mailData?.final_booking_price}
    </h4>
    <h4>
    Advance amount: ₹${mailData?.advance_amount}
    </h4>
    <h4>
    Remaining amount: ₹${mailData?.remaining_amount}
    </h4>
    <h4>
    Payment mode: ${mailData?.payment_mode}
    </h4>
    <h4>
    Payment ID: ${mailData?.payment_id}  
    </h4>
    </p>
    <ul>
    <li>It is mandatory for guests to present valid photo identification at the time of check-in.</li>
    <li> It is mandatory for guest to pay the remaining amount while check-in by Cash, UPI (Google pay, Phone pay, etc.,) or IMPS.</li>
    <li> It is mandatory for guest to pay fully refundable security deposit money in cash while check-in. This money won't be fully refunded if guest makes a damage to the property. </li>
    <li>Sometimes we relocate your stay to other property. This is in case of management issue or natural issue to avoid future problems.</li>
    </ul>
    <b>
    Property address : ${mailData?.address?.formattedAddress}
    </b>
    <p>
    Google map location: ${`http://maps.google.com/maps?z=10&t=m&q=loc:${mailData?.villa_location?.latitude}+${mailData?.villa_location?.longitude}`}
    </p>
    <h4>Caretaker contact no: 8888888888</h4>
    <b>
    For any other query, Call 8181909069
    </b>
    <p>
    Read Cancellation policy: https://leestays.com/cancellation-policy
    </p>
    We hope you have a pleasant stay and look forward to assisting you again.
    </body>
    </html>
  `;

    // Google map location: ${`https://www.google.com/maps/?q=-${mailData?.villa_location?.latitude},${mailData?.villa_location?.longitude}`}

    var mailOptions = {
        from: env.email,
        to: to,
        subject: "Thank you booking with Leestays",
        text: `Your Booking ${mailData?.booking_id} is confirmed with Leestays`,
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
};
