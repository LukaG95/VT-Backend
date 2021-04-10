const nodemailer = require("nodemailer");

class EmailingSystem {
    constructor(options) {
        this.receiver = options.email;
        this.userId = options.id;
        this.url = process.env.NODE_ENV === "production" ? "virtrade.gg" : "https://justlearningfront.website";
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
            from: "virtrade.gg", // sender address
            to: this.receiver, // list of receivers
            subject, // Subject line
            text, // plain text body
            html: `<p>${text}</p>` // html body
        };
        if (process.env.NODE_ENV === "production") messageOptions.from = '"Virtrade.gg" <rldsocials@gmail.com>';

        await transporter.sendMail(messageOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log(`Message sent: ${info.response}`);
            }
        });
    }

    async sendSignup(code) {
        await this.sendEmail("Email verification", 
          `
            Thank you for signing up \n\n

            Welcome to VirTrade <username>! \n
            Please confirm your email address by visiting: \n
            ${this.url}/email/confirm/${code} \n\n

            Happy trading! \n
            __ \n \n

            If you did not create this account we suggest you change your password and contact us at support@virtrade.gg
          `
        );
    }

    async sendPasswordReset(code) {
        await this.sendEmail("Password reset", `Your password reset link is ${this.url}/password/reset/${code}`);
    }

    async sendEmailUpdate(code) {
        await this.sendEmail("Email update", `Your email updading link is ${this.url}/email/update/${code}`);
    }
}

module.exports = EmailingSystem;
