const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/payments/verify', {
      bookingId: '6a25cebb51e01d96071570a9',
      provider: 'paystack',
      checkoutToken: 'test'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
