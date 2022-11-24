var FCM = require('fcm-node');
var serverKey ='AAAAAq7i8_I:APA91bHb162QcsEan_QQlFCCdlrH0nLWQR9lsrQQA00wDyCTMucO6VJ9RcKlQc35RxSQpGaVAyvRuNlfmawFpVymqNvbuET3ASf2NV80ZQRQxuohRUde33FM5t96IeNJToU0u1YWM7wy'
var fcm = new FCM(serverKey);

const sendNotification = (token,title,body) =>{
  // var token="cIOavw8UwIM:APA91bH97JlTN8V6tKvNFSFDRg30oAc92t0id-zdSacIjCYg-VQCetMd_oU6f9K16kmI5HN15-5Stw_cV6WdUXe2KEWTUAk79fINioGHx60BqI-ngEWD4oqZ5WgKEhH-C_RLFwDakJ9A"
  // var title="new notify"
  // var body="notification body"
  
  var message = { 
      to: token, 
      notification: {
          title: title, 
          body:body,
          Date:new Date()
          
      },
      
    //   data: {  //you can send only notification or only data(or include both)
    //       my_key: 'my value',
    //       my_another_key: 'my another value'
    //   }
  };
  
  fcm.send(message, function(err, response){
      if (err) {
          console.log("Something has gone wrong!",err);
      } else {
          console.log("Successfully sent with response: ", response);
      }
  });
  
}

// let token = 'dtBLvWKwBMw:APA91bHyAMJxptPhq--rTzYox-r97jpkgpb7fmZgLnhUqUjO6kwPcTcR9gPdZApuMcCD_ngPVTDQTFihlrdwNCyj-WoBrbUbRU5_8hcQ-z_DrxZ2w_4o3aD9z8GFoQefEZMG1-IKcA0a'
module.exports=sendNotification
// sendNotification(token,"new notify title",'title body')