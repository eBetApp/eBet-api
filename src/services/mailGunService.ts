require('dotenv').config();
const API_KEY = process.env.MAIL_KEY as string;
const DOMAIN = process.env.MAIL_DOMAIN as string;
const mailgun = require('mailgun-js')({ apiKey: API_KEY, domain: DOMAIN });

export interface Mail {
	from: string;
	to: string;
	subject: string;
	text: string;
}

export const SendMail = (data: Mail): void => {
	mailgun.messages().send(data, (error: Error, body: Body) => {
		if (body) {
			console.log('Mail gun just sent an email:');
			console.log(body);
		} else if (error) {
			console.log('Mail gun cannot send email:');
			console.log(error);
		}
	});
};
