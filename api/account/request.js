
import { createTransport } from 'nodemailer';

const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    debug: true,
    auth: {
        user: process.env.EMAIL_SEND_ADDR,
        pass: process.env.EMAIL_PASSWORD,
    },
});

transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

export default async function handler(request, response) {
    let body;
    try {
        body = JSON.parse(request.body);
    } catch {
        return response.status(400).json({ error: 'invalid request body' });
    }

    if (!body.username || !body.name || !body.email || !body.reason) {
        console.log(body);
        return response.status(400).json({ error: 'Empty fields' });
    }

    const mail_body = `Account request from: ${body.name} (${body.email})
Username: ${body.username}
Reason: ${body.reason}
--`;
    
    console.log('Sending', mail_body, process.env.EMAIL_HOST);

    try {
        const info = await transporter.sendMail({
            from: `"Gameify" <${process.env.EMAIL_SEND_ADDR}>`, // sender address
            to: process.env.EMAIL_REC_ADDR, // list of receivers
            subject: "Gameify Account Request", // Subject line
            text: mail_body, // plain text body
            html: mail_body.replaceAll(/<|>/g, '__').replaceAll('\n', '<br>'),
        });
        console.log("Message sent: ", info.messageId);

    } catch (error) {
        console.log(error);
        return response.status(400).json({ error: 'Failed to send' });
    }

    response.status(200).json({
        success: true
    });
}