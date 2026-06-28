const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testCloudinary() {
  try {
    const result = await cloudinary.search.expression("folder:flight-booking/*").execute();
    console.log("Cloudinary List Success! Found", result.resources.length, "items.");
  } catch (err) {
    console.error("Cloudinary List Error:", err);
  }
}
testCloudinary();
