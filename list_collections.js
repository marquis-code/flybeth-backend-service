const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/flybeth?retryWrites=true&w=majority";

async function listCollections() {
    try {
        await mongoose.connect(MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listCollections();
