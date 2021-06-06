const nodeMailer = require('nodemailer')
exports.generateOTP = () => {

    // Declare a digits variable  
    // which stores all digits 
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}



exports.sendEmail = async (otp, toAddress, ownerName, emailText) => {

    return new Promise((resolve, reject) => {
        let htmlText = "<!DOCTYPE html>\n"
            + "<html style=\"background: transparent; border: 0; font-size: 100%; margin: 0; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "<head>\n" + "    <meta charset=\"utf-8\">\n" + "    <title>Welcome to Pet Network</title>\n"
            + " \n" + "    \n" + "</head>\n"
            + "<body style=\"background: transparent; border: 0; color: #000000; font-family: readerregular, Arial, sans-serif; font-size: 1em; line-height: 1; margin: 0; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "    <div class=\"page-wrapper\" style=\"background: transparent; border: 1px solid #BCB5B9; box-sizing: border-box; font-size: 100%; margin: auto; outline: 0; padding: 0; vertical-align: baseline; width: 800px;\">\n"
            + "        <div class=\"page-header\" style=\"background: transparent; background-color: #000000; border: 0; box-sizing: border-box; font-size: 100%; height: 56px; margin: 0; outline: 0; padding: 12px 0px 13px 0px; text-align: center; vertical-align: baseline;\">\n"
            + "            <img src=\"https://pet-network.io/petnetwork.png\" style=\"background: transparent; border: 0; font-size: 100%; height: 41px; margin: 0; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "        </div>\n"
            + "        <div class=\"page-content\" style=\"background: transparent; background-color: #f3f3f5; border: 0; box-sizing: border-box; font-size: 100%; margin: 0; outline: 0; vertical-align: baseline;\">\n"
            + "            <div class=\"content text-center no-padding-bottom\" style=\"background: transparent; background-color: #000000; border: 0; box-sizing: border-box; font-size: 100%; margin: 0; outline: 0; padding: 40px; padding-bottom: 1px; text-align: center; vertical-align: baseline;\">\n"
            + "                <h4 style=\"background: transparent; border: 0; color: #f8fc05; font-size: 16px; font-weight: bold; line-height: 1.25; margin: 0; margin-top: 24px; outline: 0; padding: 0; vertical-align: baseline;\">HELLO &amp; WELCOME</h4>\n"
            + "                <h2 style=\"background: transparent; border: 0; color: #ffffff; font-size: 24px; font-weight: 500; line-height: 1.17; margin: 24px 0px; outline: 0; padding: 0; vertical-align: baseline;\">Welcome to Pet Network</h2>\n"
            + "            </div>\n"
            + "            <div  style=\"background: transparent; border: 0; box-sizing: border-box; font-size: 100%; margin: 0; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "                <img src=\"https://pet-network.io/FeaturedCover.jpg\" style=\"background: transparent; border: 0; font-size: 100%; margin: 0; outline: 0; padding: 0; vertical-align: baseline; width: 100%;\">\n"
            + "            </div>\n"
            + "            <div class=\"content text-center\" style=\"background: transparent; background-color: #ffffff; border: 0; box-sizing: border-box; font-size: 100%; margin: 0; outline: 0; padding: 40px; text-align: center; vertical-align: baseline;\">\n"
            + "                <p class=\"email-content\" style=\"background: transparent; border: 0; font-size: 14px; line-height: 1.43; margin: 0; outline: 0; padding: 0; text-align: left; vertical-align: baseline;\">\n"
            + "                    Hi ";

        htmlText = htmlText + " " + ownerName + ","

        htmlText = htmlText + " " + emailText + " "

        htmlText = htmlText + " " + otp

        htmlText = htmlText + "</b></div>\n" + "			<br>\n"
            + "                    With soul and love,<br>\n" + "                    Pet Network Myanmar\n"
            + "                </p>\n" + "            </div>\n"
            + "            <div class=\"page-footer\" style=\"background: transparent; border: 0; box-sizing: border-box; font-size: 100%; margin: 27px 0px 16px 0px; outline: 0; padding: 0; text-align: center; vertical-align: baseline;\">\n"
            + "                <p style=\"background: transparent; border: 0; font-size: 10px; line-height: 1.6; margin: 0; opacity: 0.5; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "                    © 2018 Pet Network. All rights reserved 2018.\n" + "                </p>\n"
            + "                <p style=\"background: transparent; border: 0; font-size: 10px; line-height: 1.6; margin: 0; opacity: 0.5; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "                    Tired of receiving these emails? Click <a href=\"#\" style=\"background: transparent; font-size: 100%; margin: 0; padding: 0; text-decoration: none; vertical-align: baseline;\">here</a> to unsubscribe\n"
            + "                </p>\n"
            + "                <div class=\"social-media\" style=\"background: transparent; border: 0; box-sizing: border-box; font-size: 100%; margin: 0; margin-top: 24px; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "                    <a href=\"#\" style=\"background: transparent; display: inline-block; font-size: 100%; margin: 0px 8px; padding: 0; text-decoration: none; vertical-align: baseline;\">\n"
            + "                        <img src=\"https://pet-network.io/facebook.png\" style=\"background: transparent; border: 0; font-size: 100%; margin: 0; outline: 0; padding: 0; vertical-align: baseline;\">\n"
            + "                    </a>\n" + "                </div>\n" + "            </div>\n"
            + "        </div>\n" + "    </div>\n" + "</body>\n" + "</html>";

        let transporter = nodeMailer.createTransport({
            host: 'martersolutions.com',
            port: 587,
            secure: false,  //true for 465 port, false for other ports
            auth: {
                user: 'noreply@martersolutions.com',
                pass: 'password!123'
            }
        });

        let mailOptions = {
            from: 'noreply@martersolutions.com"', // sender address
            to: toAddress, // list of receivers
            subject: 'Pet Network ✔', // Subject line
            html: htmlText // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Sending Email Error....",error);
                reject("CANNOT_SENT_EMAIL")
            } else {
                console.log("Send Email Successfully")
                resolve(otp)
            }
        });
    }).catch(

    )
}