/* eslint-disable no-trailing-spaces */
const nodemailer = require('nodemailer');
const aws = require('aws-sdk');


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

    newAwsTransport() {
        this.transporter = nodemailer.createTransport({
            host: 'email-smtp.eu-west-2.amazonaws.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'AKIA3TLDQUNCJRB3O7GR',
                pass: 'BEDaMAXJ648jO7tXSXT4waL+uDH8qbZyaNJMxA+LdIwf',
            },
        
        });
        return this.transporter;
    }

    async sendEmail(subject, text) {
        const transporter = this.newAwsTransport();
        const messageOptions = {
            from: 'nikforce1605@mail.ru', // sender address
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
