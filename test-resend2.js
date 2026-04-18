require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

resend.emails.send({
  from: 'Flybeth <no-reply@flybeth.com>',
  to: 'markeyz.code@gmail.com',
  subject: 'Test Email from CLI',
  html: '<strong>it works</strong>'
}).then(console.log).catch(console.error);
