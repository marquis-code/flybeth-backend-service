/**
 * Seeds the platform-owned ("flybeth") inventory that backs the hotels,
 * transfers, activities and car-rental funnels when no external supplier is
 * configured.
 *
 * Idempotent: every document is upserted on a natural key, so it is safe to run
 * repeatedly.
 *
 * Usage:  node scripts/seed-local-inventory.js
 */
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Schema } = mongoose;

// ─── Schemas (kept in sync with the Nest schemas) ────────────────────────────

const staySchema = new Schema(
  {
    name: String,
    description: String,
    type: { type: String, enum: ["hotel", "apartment", "villa", "resort", "cabin"] },
    location: {
      address: String,
      city: String,
      country: String,
      coordinates: { lat: Number, lng: Number },
    },
    images: [String],
    amenities: [String],
    rating: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);

const roomSchema = new Schema(
  {
    stay: { type: Schema.Types.ObjectId, ref: "Stay" },
    name: String,
    description: String,
    pricePerNight: Number,
    capacity: Number,
    images: [String],
    amenities: [String],
    quantity: Number,
  },
  { timestamps: true, strict: false },
);

const transferSchema = new Schema(
  {
    name: String,
    transferType: String,
    vehicleCode: String,
    vehicleDescription: String,
    startLocationCode: String,
    city: String,
    countryCode: String,
    basePrice: Number,
    currency: { type: String, default: "USD" },
    durationMinutes: Number,
    maxPassengers: Number,
    maxLuggage: Number,
    cancellationPolicy: String,
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);

const experienceSchema = new Schema(
  {
    name: String,
    description: String,
    shortDescription: String,
    city: String,
    countryCode: String,
    latitude: Number,
    longitude: Number,
    categories: [String],
    photos: [String],
    price: Number,
    currency: { type: String, default: "USD" },
    rating: Number,
    minimumDuration: String,
    maxParticipants: Number,
    bookingLink: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);

const carSchema = new Schema({}, { timestamps: true, strict: false });

const Stay = mongoose.model("Stay", staySchema, "stays");
const Room = mongoose.model("Room", roomSchema, "rooms");
const Transfer = mongoose.model("TransferInventory", transferSchema, "transferinventories");
const Experience = mongoose.model("ExperienceInventory", experienceSchema, "experienceinventories");
const Car = mongoose.model("Car", carSchema, "cars");

// ─── Data ────────────────────────────────────────────────────────────────────

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=1200`;

const HOTELS = [
  {
    name: "The Shard Riverside Hotel",
    type: "hotel",
    city: "London",
    country: "GB",
    countryName: "United Kingdom",
    address: "32 London Bridge St, London",
    lat: 51.5045,
    lng: -0.0865,
    rating: 5,
    amenities: ["wifi", "pool", "gym", "spa", "restaurant", "bar", "parking", "air conditioning"],
    images: [img("photo-1566073771259-6a8506099945"), img("photo-1582719508461-905c673771fd")],
    rooms: [
      { name: "Deluxe King Room", pricePerNight: 210, capacity: 2 },
      { name: "Executive Suite", pricePerNight: 385, capacity: 3 },
      { name: "Family Room", pricePerNight: 430, capacity: 5 },
    ],
  },
  {
    name: "Kensington Garden Residence",
    type: "apartment",
    city: "London",
    country: "GB",
    countryName: "United Kingdom",
    address: "14 Gloucester Rd, Kensington, London",
    lat: 51.4945,
    lng: -0.1834,
    rating: 4,
    amenities: ["wifi", "kitchen", "washer", "heating", "air conditioning"],
    images: [img("photo-1522708323590-d24dbb6b0267")],
    rooms: [
      { name: "One Bedroom Apartment", pricePerNight: 145, capacity: 2 },
      { name: "Two Bedroom Apartment", pricePerNight: 225, capacity: 4 },
    ],
  },
  {
    name: "Dubai Marina Skyline Resort",
    type: "resort",
    city: "Dubai",
    country: "AE",
    countryName: "United Arab Emirates",
    address: "Marina Walk, Dubai Marina, Dubai",
    lat: 25.0805,
    lng: 55.1403,
    rating: 5,
    amenities: ["wifi", "private beach", "pool", "gym", "spa", "restaurant", "bar", "airport shuttle"],
    images: [img("photo-1512453979798-5ea266f8880c"), img("photo-1518684079-3c830dcef090")],
    rooms: [
      { name: "Marina View Room", pricePerNight: 265, capacity: 2 },
      { name: "Skyline Suite", pricePerNight: 480, capacity: 4 },
    ],
  },
  {
    name: "Downtown Dubai Grand Hotel",
    type: "hotel",
    city: "Dubai",
    country: "AE",
    countryName: "United Arab Emirates",
    address: "Sheikh Mohammed bin Rashid Blvd, Dubai",
    lat: 25.1972,
    lng: 55.2744,
    rating: 5,
    amenities: ["wifi", "pool", "gym", "spa", "restaurant", "valet parking", "air conditioning"],
    images: [img("photo-1564501049412-61c2a3083791")],
    rooms: [
      { name: "Burj View Deluxe", pricePerNight: 320, capacity: 2 },
      { name: "Royal Suite", pricePerNight: 690, capacity: 4 },
    ],
  },
  {
    name: "Paris Marais Boutique Hotel",
    type: "hotel",
    city: "Paris",
    country: "FR",
    countryName: "France",
    address: "8 Rue de Rivoli, Le Marais, Paris",
    lat: 48.8566,
    lng: 2.3522,
    rating: 4,
    amenities: ["wifi", "breakfast", "bar", "concierge", "air conditioning"],
    images: [img("photo-1502602898657-3e91760cbb34")],
    rooms: [
      { name: "Classic Double", pricePerNight: 178, capacity: 2 },
      { name: "Superior Twin", pricePerNight: 215, capacity: 2 },
      { name: "Junior Suite", pricePerNight: 340, capacity: 3 },
    ],
  },
  {
    name: "Montmartre Artists' Loft",
    type: "apartment",
    city: "Paris",
    country: "FR",
    countryName: "France",
    address: "22 Rue Lepic, Montmartre, Paris",
    lat: 48.8867,
    lng: 2.3376,
    rating: 4,
    amenities: ["wifi", "kitchen", "heating", "washer"],
    images: [img("photo-1502672260266-1c1ef2d93688")],
    rooms: [{ name: "Loft Studio", pricePerNight: 132, capacity: 2 }],
  },
  {
    name: "Lagos Continental Marina Hotel",
    type: "hotel",
    city: "Lagos",
    country: "NG",
    countryName: "Nigeria",
    address: "1 Adeola Odeku St, Victoria Island, Lagos",
    lat: 6.4281,
    lng: 3.4219,
    rating: 4,
    amenities: ["wifi", "pool", "gym", "restaurant", "bar", "airport shuttle", "air conditioning"],
    images: [img("photo-1551882547-ff40c63fe5fa")],
    rooms: [
      { name: "Standard Queen", pricePerNight: 95, capacity: 2 },
      { name: "Executive Double", pricePerNight: 150, capacity: 2 },
      { name: "Presidential Suite", pricePerNight: 320, capacity: 4 },
    ],
  },
  {
    name: "Abuja Central Business Hotel",
    type: "hotel",
    city: "Abuja",
    country: "NG",
    countryName: "Nigeria",
    address: "Plot 1075, Central Business District, Abuja",
    lat: 9.0579,
    lng: 7.4951,
    rating: 4,
    amenities: ["wifi", "pool", "gym", "restaurant", "parking", "air conditioning"],
    images: [img("photo-1571003123894-1f0594d2b5d9")],
    rooms: [
      { name: "Standard Room", pricePerNight: 78, capacity: 2 },
      { name: "Business Suite", pricePerNight: 165, capacity: 3 },
    ],
  },
  {
    name: "New York Midtown Grand",
    type: "hotel",
    city: "New York",
    country: "US",
    countryName: "United States",
    address: "1535 Broadway, Midtown, New York",
    lat: 40.758,
    lng: -73.9855,
    rating: 5,
    amenities: ["wifi", "gym", "restaurant", "bar", "room service", "air conditioning"],
    images: [img("photo-1542314831-068cd1dbfeeb")],
    rooms: [
      { name: "City View Queen", pricePerNight: 289, capacity: 2 },
      { name: "Times Square Suite", pricePerNight: 545, capacity: 4 },
    ],
  },
  {
    name: "Cape Town Table Bay Lodge",
    type: "resort",
    city: "Cape Town",
    country: "ZA",
    countryName: "South Africa",
    address: "Quay 5, V&A Waterfront, Cape Town",
    lat: -33.9064,
    lng: 18.4199,
    rating: 5,
    amenities: ["wifi", "pool", "spa", "restaurant", "bar", "mountain view"],
    images: [img("photo-1566073771259-6a8506099945")],
    rooms: [
      { name: "Table Mountain View", pricePerNight: 235, capacity: 2 },
      { name: "Waterfront Suite", pricePerNight: 410, capacity: 4 },
    ],
  },
  {
    name: "Nairobi Karen Safari Lodge",
    type: "cabin",
    city: "Nairobi",
    country: "KE",
    countryName: "Kenya",
    address: "Karen Road, Nairobi",
    lat: -1.3192,
    lng: 36.7073,
    rating: 4,
    amenities: ["wifi", "restaurant", "game drives", "garden", "airport shuttle"],
    images: [img("photo-1520250497591-112f2f40a3f4")],
    rooms: [
      { name: "Garden Cottage", pricePerNight: 168, capacity: 2 },
      { name: "Family Lodge", pricePerNight: 275, capacity: 5 },
    ],
  },
  {
    name: "Accra Airport Business Hotel",
    type: "hotel",
    city: "Accra",
    country: "GH",
    countryName: "Ghana",
    address: "Airport City, Accra",
    lat: 5.6052,
    lng: -0.1668,
    rating: 4,
    amenities: ["wifi", "pool", "gym", "restaurant", "airport shuttle", "air conditioning"],
    images: [img("photo-1590490360182-c33d57733427")],
    rooms: [
      { name: "Standard King", pricePerNight: 88, capacity: 2 },
      { name: "Executive Suite", pricePerNight: 180, capacity: 3 },
    ],
  },
];

// [airport, city, label, distanceKm, basePricePrivate, basePriceShared]
const TRANSFER_HUBS = [
  ["LHR", "London", "GB", 28, 95, 32],
  ["LGW", "London", "GB", 45, 110, 38],
  ["DXB", "Dubai", "AE", 22, 70, 25],
  ["CDG", "Paris", "FR", 32, 90, 30],
  ["ORY", "Paris", "FR", 18, 75, 26],
  ["LOS", "Lagos", "NG", 20, 55, 18],
  ["ABV", "Abuja", "NG", 38, 65, 22],
  ["JFK", "New York", "US", 24, 120, 45],
  ["CPT", "Cape Town", "ZA", 22, 60, 20],
  ["NBO", "Nairobi", "KE", 18, 50, 17],
  ["ACC", "Accra", "GH", 9, 40, 14],
];

const VEHICLES = [
  { code: "SEDAN", name: "Private Sedan", desc: "Comfortable sedan for up to 3 passengers", pax: 3, bags: 3, mult: 1 },
  { code: "SUV", name: "Private SUV", desc: "Spacious SUV for up to 5 passengers", pax: 5, bags: 5, mult: 1.45 },
  { code: "VAN", name: "Private Minivan", desc: "Minivan for groups of up to 7 passengers", pax: 7, bags: 7, mult: 1.8 },
  { code: "SHUTTLE", name: "Shared Shuttle", desc: "Economical shared transfer", pax: 8, bags: 2, mult: 0.38 },
];

const ACTIVITIES = [
  {
    name: "London Eye Fast-Track Experience",
    city: "London",
    country: "GB",
    lat: 51.5033,
    lng: -0.1196,
    price: 48,
    rating: 4.6,
    duration: "1 hour",
    categories: ["sightseeing", "family", "landmark"],
    photo: "photo-1513635269975-59663e0ac1ad",
    description: "Skip the queue and ride the iconic London Eye with panoramic views across the Thames and the city skyline.",
  },
  {
    name: "Thames Sunset River Cruise",
    city: "London",
    country: "GB",
    lat: 51.5074,
    lng: -0.1278,
    price: 39,
    rating: 4.5,
    duration: "2 hours",
    categories: ["cruise", "romantic", "sightseeing"],
    photo: "photo-1505761671935-60b3a7427bad",
    description: "Glide past Tower Bridge, the Shard and the Houses of Parliament on a golden-hour cruise with a welcome drink.",
  },
  {
    name: "Desert Safari with BBQ Dinner",
    city: "Dubai",
    country: "AE",
    lat: 24.8855,
    lng: 55.4572,
    price: 75,
    rating: 4.8,
    duration: "6 hours",
    categories: ["adventure", "desert", "family", "dinner"],
    photo: "photo-1451337516015-6b6e9a44a8a3",
    description: "Dune bashing in 4x4s, camel rides, sandboarding and a live BBQ buffet under the stars at a Bedouin camp.",
  },
  {
    name: "Burj Khalifa 124th Floor Observatory",
    city: "Dubai",
    country: "AE",
    lat: 25.1972,
    lng: 55.2744,
    price: 55,
    rating: 4.7,
    duration: "1.5 hours",
    categories: ["landmark", "sightseeing", "family"],
    photo: "photo-1512453979798-5ea266f8880c",
    description: "Ascend the world's tallest building and take in 360-degree views from the 124th floor observation deck.",
  },
  {
    name: "Paris Seine Dinner Cruise",
    city: "Paris",
    country: "FR",
    lat: 48.8606,
    lng: 2.3376,
    price: 89,
    rating: 4.6,
    duration: "2.5 hours",
    categories: ["cruise", "romantic", "dinner"],
    photo: "photo-1499856871958-5b9627545d1a",
    description: "A three-course French dinner while drifting past Notre-Dame, the Louvre and a sparkling Eiffel Tower.",
  },
  {
    name: "Louvre Museum Guided Tour",
    city: "Paris",
    country: "FR",
    lat: 48.8606,
    lng: 2.3376,
    price: 62,
    rating: 4.7,
    duration: "3 hours",
    categories: ["museum", "culture", "art"],
    photo: "photo-1499856871958-5b9627545d1a",
    description: "Skip-the-line entry with an expert guide covering the Mona Lisa, Venus de Milo and the museum's masterpieces.",
  },
  {
    name: "Lagos Island Food & Culture Walk",
    city: "Lagos",
    country: "NG",
    lat: 6.455,
    lng: 3.3841,
    price: 35,
    rating: 4.5,
    duration: "4 hours",
    categories: ["food", "culture", "walking"],
    photo: "photo-1551882547-ff40c63fe5fa",
    description: "Taste jollof, suya and street snacks while exploring the markets and history of Lagos Island with a local host.",
  },
  {
    name: "Abuja City Highlights Tour",
    city: "Abuja",
    country: "NG",
    lat: 9.0579,
    lng: 7.4951,
    price: 42,
    rating: 4.4,
    duration: "5 hours",
    categories: ["city", "culture", "sightseeing"],
    photo: "photo-1571003123894-1f0594d2b5d9",
    description: "Discover Aso Rock, the National Mosque and the millennium landmarks of Nigeria's planned capital.",
  },
  {
    name: "Manhattan Skyline Helicopter Tour",
    city: "New York",
    country: "US",
    lat: 40.758,
    lng: -73.9855,
    price: 189,
    rating: 4.8,
    duration: "20 minutes",
    categories: ["adventure", "sightseeing", "luxury"],
    photo: "photo-1542314831-068cd1dbfeeb",
    description: "Soar over the Statue of Liberty, Central Park and the Empire State Building on an unforgettable flight.",
  },
  {
    name: "Table Mountain Sunrise Hike",
    city: "Cape Town",
    country: "ZA",
    lat: -33.9628,
    lng: 18.4098,
    price: 58,
    rating: 4.7,
    duration: "4 hours",
    categories: ["hiking", "adventure", "nature"],
    photo: "photo-1566073771259-6a8506099945",
    description: "Guided dawn ascent of Platteklip Gorge with a cable-car descent and sweeping views over the Atlantic seaboard.",
  },
  {
    name: "Nairobi National Park Game Drive",
    city: "Nairobi",
    country: "KE",
    lat: -1.3733,
    lng: 36.8583,
    price: 68,
    rating: 4.6,
    duration: "5 hours",
    categories: ["safari", "wildlife", "nature"],
    photo: "photo-1520250497591-112f2f40a3f4",
    description: "Spot lions, rhinos and giraffes against the Nairobi skyline in the world's only capital-city national park.",
  },
  {
    name: "Accra Jamestown Walking Tour",
    city: "Accra",
    country: "GH",
    lat: 5.5394,
    lng: -0.2076,
    price: 30,
    rating: 4.4,
    duration: "3 hours",
    categories: ["culture", "history", "walking"],
    photo: "photo-1590490360182-c33d57733427",
    description: "Explore the colonial-era lighthouse, fishing harbour and vibrant street art of historic Jamestown.",
  },
];

const CARS = [
  { name: "Toyota Corolla", category: "Economy", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 3, transmission: "automatic", fuelType: "petrol", doors: 4, baseRate: 42 },
  { name: "Hyundai Elantra", category: "Economy", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 2, transmission: "automatic", fuelType: "petrol", doors: 4, baseRate: 45 },
  { name: "Toyota RAV4", category: "SUV", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 4, transmission: "automatic", fuelType: "hybrid", doors: 5, baseRate: 78 },
  { name: "Mercedes-Benz E-Class", category: "Luxury", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 3, transmission: "automatic", fuelType: "petrol", doors: 4, baseRate: 145 },
  { name: "BMW 5 Series", category: "Luxury", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 3, transmission: "automatic", fuelType: "diesel", doors: 4, baseRate: 152 },
  { name: "Tesla Model 3", category: "Electric", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 2, transmission: "automatic", fuelType: "electric", doors: 4, baseRate: 118 },
  { name: "Kia Carnival", category: "Minivan", type: "rental", vendor: "Flybeth Fleet", passengers: 7, luggage: 6, transmission: "automatic", fuelType: "diesel", doors: 5, baseRate: 92 },
  { name: "Ford Transit", category: "Van", type: "rental", vendor: "Flybeth Fleet", passengers: 9, luggage: 9, transmission: "manual", fuelType: "diesel", doors: 4, baseRate: 105 },
  { name: "Jeep Wrangler", category: "SUV", type: "rental", vendor: "Flybeth Fleet", passengers: 4, luggage: 2, transmission: "automatic", fuelType: "petrol", doors: 2, baseRate: 110 },
  { name: "Range Rover Velar", category: "Luxury", type: "rental", vendor: "Flybeth Fleet", passengers: 5, luggage: 4, transmission: "automatic", fuelType: "diesel", doors: 5, baseRate: 210 },
];

const CAR_LOCATIONS = [
  "London", "LHR", "Heathrow", "Dubai", "DXB", "Paris", "CDG", "Lagos", "LOS",
  "Abuja", "ABV", "New York", "JFK", "Cape Town", "CPT", "Nairobi", "NBO",
  "Accra", "ACC",
];

/** A representative, publicly loadable photo for each car category. */
const CAR_IMAGES = {
  Economy: img("photo-1549317661-bd32c8ce0db2"),
  SUV: img("photo-1519641471654-76ce0107ad1b"),
  Luxury: img("photo-1503376780353-7e6692767b70"),
  Electric: img("photo-1560958089-b8a1929cea89"),
  Minivan: img("photo-1550355291-bbee04a92027"),
  Van: img("photo-1601362840469-51e4d8d58785"),
  Standard: img("photo-1494976388531-d1058494cdd8"),
};
const carImage = (category) => CAR_IMAGES[category] || CAR_IMAGES.Standard;

// ─── Seeding ─────────────────────────────────────────────────────────────────

async function seedStays() {
  let created = 0;
  for (const hotel of HOTELS) {
    const doc = await Stay.findOneAndUpdate(
      { name: hotel.name },
      {
        $set: {
          name: hotel.name,
          description: `${hotel.name} is a ${hotel.rating}-star ${hotel.type} in ${hotel.city}, ${hotel.countryName}. Book with Flybeth and pay in your own currency.`,
          type: hotel.type,
          location: {
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            coordinates: { lat: hotel.lat, lng: hotel.lng },
          },
          images: hotel.images,
          amenities: hotel.amenities,
          rating: hotel.rating,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    for (const room of hotel.rooms) {
      await Room.findOneAndUpdate(
        { stay: doc._id, name: room.name },
        {
          $set: {
            stay: doc._id,
            name: room.name,
            description: `${room.name} at ${hotel.name}`,
            pricePerNight: room.pricePerNight,
            capacity: room.capacity,
            images: hotel.images,
            amenities: hotel.amenities,
            quantity: 10,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }
    created += 1;
  }
  console.log(`✔ stays: ${created} properties upserted`);
}

async function seedTransfers() {
  let count = 0;
  for (const [code, city, country, distance, privatePrice, sharedPrice] of TRANSFER_HUBS) {
    for (const vehicle of VEHICLES) {
      const isShared = vehicle.code === "SHUTTLE";
      const base = isShared ? sharedPrice : privatePrice;
      const price = Math.round(base * vehicle.mult * 100) / 100;
      const name = `${city} ${code} Airport → ${city} City Centre (${vehicle.name})`;

      await Transfer.findOneAndUpdate(
        { name },
        {
          $set: {
            name,
            transferType: isShared ? "SHARED" : "PRIVATE",
            vehicleCode: vehicle.code,
            vehicleDescription: `${vehicle.name} · ${vehicle.desc}`,
            startLocationCode: code,
            city,
            countryCode: country,
            basePrice: price,
            currency: "USD",
            durationMinutes: Math.max(25, Math.round(distance * 1.8)),
            maxPassengers: vehicle.pax,
            maxLuggage: vehicle.bags,
            cancellationPolicy: "Free cancellation up to 24 hours before pickup",
            images: [],
            isActive: true,
          },
        },
        { upsert: true, setDefaultsOnInsert: true },
      );
      count += 1;
    }
  }
  console.log(`✔ transfers: ${count} routes upserted`);
}

async function seedExperiences() {
  let count = 0;
  for (const activity of ACTIVITIES) {
    await Experience.findOneAndUpdate(
      { name: activity.name, city: activity.city },
      {
        $set: {
          name: activity.name,
          description: activity.description,
          shortDescription: activity.description.slice(0, 120),
          city: activity.city,
          countryCode: activity.country,
          latitude: activity.lat,
          longitude: activity.lng,
          categories: activity.categories,
          photos: [img(activity.photo)],
          price: activity.price,
          currency: "USD",
          rating: activity.rating,
          minimumDuration: activity.duration,
          maxParticipants: 20,
          isActive: true,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    count += 1;
  }
  console.log(`✔ experiences: ${count} activities upserted`);
}

async function seedCars() {
  // Top up the platform fleet with the canonical schema shape.
  let count = 0;
  for (const car of CARS) {
    await Car.findOneAndUpdate(
      { name: car.name, vendor: car.vendor },
      {
        $set: {
          name: car.name,
          type: car.type,
          vendor: car.vendor,
          category: car.category,
          capacity: { passengers: car.passengers, luggage: car.luggage },
          specifications: {
            transmission: car.transmission,
            fuelType: car.fuelType,
            airConditioning: true,
            doors: car.doors,
          },
          pricing: { baseRate: car.baseRate, currency: "USD", basePrice: car.baseRate },
          price: { amount: car.baseRate, currency: "USD" },
          images: [carImage(car.category)],
          isAvailable: true,
          availableLocations: CAR_LOCATIONS,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    count += 1;
  }

  // Repair pre-existing inventory that used the older field layout so it is
  // priced and rendered correctly.
  const legacy = await Car.find({
    $or: [{ "pricing.baseRate": { $exists: false } }, { name: { $exists: false } }],
  });
  for (const car of legacy) {
    const rate =
      car.pricing?.basePrice || car.price?.amount || car.pricing?.baseRate || 0;
    await Car.updateOne(
      { _id: car._id },
      {
        $set: {
          name: car.name || car.vehicle?.name || "Rental car",
          category: car.category || car.vehicle?.type || "Standard",
          pricing: { ...(car.pricing || {}), baseRate: rate, basePrice: rate, currency: car.pricing?.currency || "USD" },
          specifications: car.specifications || {
            transmission: car.vehicle?.transmission || "automatic",
            fuelType: car.vehicle?.fuelType || "petrol",
            airConditioning: true,
          },
          capacity: {
            passengers: car.capacity?.passengers || car.vehicle?.passengers || 5,
            luggage: car.capacity?.luggage || car.vehicle?.bagsLarge || 2,
          },
          availableLocations: car.availableLocations?.length ? car.availableLocations : CAR_LOCATIONS,
          // Placeholder example.com URLs render as broken images in the UI.
          images: (car.images || car.vehicle?.images || []).some(
            (u) => typeof u === "string" && !u.includes("example.com"),
          )
            ? car.images || car.vehicle?.images
            : [carImage(car.category || car.vehicle?.type || "Standard")],
          isAvailable: car.isAvailable !== false,
        },
      },
    );
  }

  console.log(`✔ cars: ${count} fleet vehicles upserted, ${legacy.length} legacy rows repaired`);
}

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected. Seeding platform inventory…\n");

  await seedStays();
  await seedTransfers();
  await seedExperiences();
  await seedCars();

  console.log("\nDone.");
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
