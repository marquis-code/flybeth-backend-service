const axios = require('axios');
axios.post('http://localhost:3000/api/v1/chat/support/init', { name: "Test User", email: "test@test.com" })
  .then(res => {
    console.log("Success:", res.data);
  })
  .catch(err => {
    console.error("Error:", err.response ? err.response.data : err.message);
  });
