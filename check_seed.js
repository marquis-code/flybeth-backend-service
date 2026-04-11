const mongoose = require('mongoose');

async function checkCampaigns() {
    try {
        await mongoose.connect('mongodb://localhost:27017/flybeth');
        const Campaign = mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }));
        const count = await Campaign.countDocuments();
        console.log(`Current Campaign count: ${count}`);
        const campaigns = await Campaign.find().limit(5);
        console.log('Sample Campaigns:', campaigns.map(c => c.title));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCampaigns();
