const nodemailer = require("nodemailer");

class EmailingSystem {
    constructor(options) {
        this.receiver = options.email;
        this.userId = options.id;
        this.url = process.env.NODE_ENV === "production" ? "https://virtrade.gg" : "http://localhost:3000";
    }

    newTransporter() {
        if (process.env.NODE_ENV === "production") {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: 465,
                auth: {
                    user: process.env.EMAIL_LOGIN,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        } else {
            this.transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: "dolly12@ethereal.email",
                    pass: "9unyCuCYf521v3nnzu"
                },
                tls: { rejectUnauthorized: false }
            });
        }
        return this.transporter;
    }

    async sendEmail(subject, text) {
        const transporter = this.newTransporter();
        const messageOptions = {
            from: '"VirTrade" <info@virtrade.gg>', // sender address
            to: this.receiver, // list of receivers
            subject, // Subject line
            text, // plain text body
            html: `<b>${text}</b>` // html body
        };
        // if (process.env.NODE_ENV === "production") messageOptions.from = '"Virtrade.gg" <rldsocials@gmail.com>';

        transporter.sendMail(messageOptions, (err, res) => console.log(res.response));
    }

    async sendSignup(code) {
        await this.sendEmail("Email verification", `Your email verification link is <br> <a href= "${this.url}/email/confirm/${code}">${this.url}/email/confirm/${code}</a> <br> Valid for 15 minutes!`);
    }

    async sendPasswordReset(code) {
        await this.sendEmail("Password reset", `Please ignore the email, if you have not issued this! <br><br> Your password reset link is <br> <a href= "${this.url}/password/reset/${code}">${this.url}/password/reset/${code}</a> <br><br> Valid for 15 minutes!`);
    }

    async sendEmailUpdate(code, newEmail) {
        await this.sendEmail("Email update", `Please ignore the email, if you have not issued this! <br><br> Your email updating link is <br> <a href= "${this.url}/email/update/${code}">${this.url}/email/update/${code}</a> <br> Once clicked, your email would be changed to ${newEmail}! <br><br> Valid for 15 minutes!`);
    }
}

module.exports = EmailingSystem;
