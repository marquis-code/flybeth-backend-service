const crypto = require('crypto');

const apiKey = "d38a135dc36eead5728e5e5234317081";
const apiSecret = "eb6bdd4d04";
const timestamp = Math.floor(Date.now() / 1000);
const signature = crypto.createHash('sha256').update(apiKey + apiSecret + timestamp).digest('hex');

const checkIn = new Date().toISOString().split('T')[0];
const checkOut = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const payload = {
  stay: {
    checkIn,
    checkOut
  },
  occupancies: [
    {
      rooms: 1,
      adults: 2,
      children: 0
    }
  ],
  geolocation: {
    latitude: 51.5074,
    longitude: -0.1278,
    radius: 20,
    unit: "km"
  }
};

fetch('https://api.test.hotelbeds.com/hotel-api/1.0/hotels', {
  method: 'POST',
  headers: {
    'Api-key': apiKey,
    'X-Signature': signature,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
.then(res => res.text().then(text => ({status: res.status, body: text})))
.then(console.log)
.catch(console.error);
