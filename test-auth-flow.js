const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/marketing/campaigns', {
      title: "CLI Real Send Test",
      subject: "Checking full pipeline",
      content: "<strong>Hello world</strong>",
      target: "specific",
      customRecipients: [],
      targetEmails: "abahmarquis@gmail.com,markeyz.code@gmail.com",
      status: "sent"
    }, {
      headers: { Authorization: "Bearer " + "ADMIN_TOKEN_HERE" } // I don't have a token. Instead I will query DB directly.
    })
    console.log(res.data);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
