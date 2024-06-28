const mongoose = require('mongoose');

const userConfigurationSchema = new mongoose.Schema({
    publicKey: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    }
});

const UserConfiguration = mongoose.model('UserConfiguration', userConfigurationSchema);

module.exports = UserConfiguration;
