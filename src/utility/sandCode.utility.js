const transporter = require("../config/email");

const sendCode = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verification Code",
    text: `Your verification code is: ${code}`,
  });
};

module.exports = sendCode;