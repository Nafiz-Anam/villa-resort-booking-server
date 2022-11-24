var request = require("request");
const axios = require("axios");

exports.sendSms = async function (phone_number, name) {
    var message = "OTP sent to you registered mobile number successfully!";
    var number = Math.floor(Math.random() * 90000) + 10000;
    console.log("otp code =>", number);
  

    const otp_message = `Dear ${name}, Your secret OTP is ${number} for login/register at LEESTAYS. Valid only for 3 minutes.`;

    const SMS_URL = `http://admin.technoplanetsoft.com/submitsms.jsp?user=leestay&key=66b86f5becXX&mobile=${phone_number}&senderid=LISTAY&message=${otp_message}&accusage=1&entityid=1201164179840206321&tempid=1207164197758882007`;
    axios
        .get(SMS_URL)
        .then((response) => console.log(response.data))
        .catch((err) => console.log(err));

    return number;
};
