const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function checkTestUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find().limit(10);
        console.log('Found users in default DB:', users.map(u => ({ email: u.email, role: u.role, id: u._id })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTestUsers();
