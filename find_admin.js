const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function findAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const admin = await User.findOne({ role: 'super_admin' });
        if (admin) {
            console.log('Super Admin found:', admin.email, admin._id);
        } else {
            console.log('No Super Admin found. Searching for special bypass email...');
            const special = await User.findOne({ email: 'abahmarquis@gmail.com' });
            if (special) {
                console.log('Special user found:', special.email, special._id);
            } else {
                const any = await User.findOne();
                console.log('Using any user found:', any ? any.email : 'NONE', any ? any._id : 'NONE');
            }
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

findAdmin();
