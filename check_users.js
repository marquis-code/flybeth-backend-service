const mongoose = require('mongoose');

async function checkUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/flybeth');
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find().limit(10);
        console.log('Found users:', users.map(u => ({ email: u.email, role: u.role })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
