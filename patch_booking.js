require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db();
    const bookings = database.collection('bookings');
    
    const booking = await bookings.findOne({ pnr: "AVFWMF" });
    if (!booking) return;

    // Patch isRoundTrip
    await bookings.updateOne({ pnr: "AVFWMF" }, { $set: { isRoundTrip: true } });

    // Patch flights[0].metadata.slices
    const flights = booking.flights;
    if (flights && flights.length > 0) {
      flights[0].metadata.slices = [
        {
          segments: [
            {
              origin: { iata_code: "LOS" },
              destination: { iata_code: "JFK" },
              marketing_carrier: { name: "American Airlines" },
              departing_at: "2026-07-08T05:25:00"
            }
          ]
        },
        {
          segments: [
            {
              origin: { iata_code: "JFK" },
              destination: { iata_code: "LOS" },
              marketing_carrier: { name: "American Airlines" },
              departing_at: "2026-07-15T18:40:00"
            }
          ]
        }
      ];
      await bookings.updateOne({ pnr: "AVFWMF" }, { $set: { flights: flights } });
    }
    
    console.log("Successfully patched AVFWMF");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
