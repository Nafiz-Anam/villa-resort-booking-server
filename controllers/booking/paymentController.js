const Razorpay = require("razorpay");
const { env } = require("../../config/config");
const crypto = require("crypto");

module.exports.orderPayment = async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_SECRET,
        });

        const options = {
            amount: req.body.amount, // amount in smallest currency unit
            currency: "",
            receipt: "",
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).send("Server side error!");
        }
        console.log("order details => ", order);
        res.json(order);
    } catch (error) {
        console.log("order error => ", error);
        res.status(500).send(error);
    }
};

module.exports.successPayment = async (req, res) => {
    try {
        const instance = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_SECRET,
        });
        // getting the details back from our font-end
        const orderCreationId = req.body.razorpay_order_id,
            razorpayPaymentId = req.body.transactionid,
            razorpayOrderId = req.body.razorpay_order_id,
            razorpaySignature = req.body.razorpay_signature;

        
        instance.orders.fetch(razorpayOrderId).then((data) => {
            console.log("Payment is Successful", data);
        });
        return res.json({
            msg: "success",
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).send("payment success err => ", error);
    }
};

const verifyOrder = (id) => {
    try {
        const instance = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_SECRET,
        });
        instance.orders
            .fetch(id)
            .then((data) => {
                console.log("Payment is Successful", data);
            })
            .catch((err) => {
                console.log("error", err);
            });
    } catch (err) {
        console.log("ID not found", err);
    }
};

// verifyOrder("123")
