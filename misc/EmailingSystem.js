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
            html: `<p>${text}</p>` // html body
        };
        // if (process.env.NODE_ENV === "production") messageOptions.from = '"Virtrade.gg" <rldsocials@gmail.com>';

        transporter.sendMail(messageOptions, (err, res) => console.log(res.response));
    }

    async sendSignup(code, username) {
        await this.sendEmail("Email verification", 
          `
            Thank you for signing up <br /><br />

            Welcome to VirTrade ${username}! <br />
            Please confirm your email address by visiting: <br />
            ${this.url}/email/confirm/${code} <br /><br />

            Happy trading! <br />
            __ <br /><br />

            Link is active for 15 minutes.<br />
            If you did not create this account ignore this email. For support contact us at support@virtrade.gg
          `
        );
    }

    async sendPasswordReset(code) {
        await this.sendEmail("Password reset", `
          To confirm reseting password click on the link below: <br />
          ${this.url}/password/reset/${code} <br /><br />

          __ <br /><br />

          Link is active for 15 minutes.<br />
          If you did not create this request ignore this email. For support contact us at support@virtrade.gg
        `);
    }

    async sendEmailUpdate(code, newEmail) {
        await this.sendEmail("Email update", 
          `
            To update your email to ${newEmail}, click on the link below: <br />
            ${this.url}/email/update/${code} <br /><br />

            __ <br /><br />

            Link is active for 15 minutes.<br />
            If you did not create this request ignore this email. For support contact us at support@virtrade.gg
          `
        );
    }
}

module.exports = EmailingSystem;
