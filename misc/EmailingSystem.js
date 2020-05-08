/* eslint-disable no-trailing-spaces */
const nodemailer = require('nodemailer');


class EmailingSystem {
    constructor(options) {
        this.receiver = options.email;
    }

    newTransporter() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'dolly12@ethereal.email',
                pass: '9unyCuCYf521v3nnzu',
            },
            tls: { rejectUnauthorized: false },
        });
        return this.transporter;
    }

    async sendEmail(subject, text) {
        const transporter = this.newTransporter();
        const messageOptions = {
            from: '"Dolly Bradtke" <admin@virtrade.gg>', // sender address
            to: this.receiver, // list of receivers
            subject, // Subject line
            text, // plain text body
            html: `<b>${text}</b>`, // html body
        };
        await transporter.sendMail(messageOptions);
    }

    async sendSignup(code) {
        await this.sendEmail('Email verification', `Your verification code is ${code}`);
    }

    async sendVerification(code) {
        
    }
}


module.exports = EmailingSystem;
