const mongoose = require('mongoose');

const userConfigurationSchema = new mongoose.Schema({
    key:{
        type:Number,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true,
    }
})

const userConfiguration = mongoose.model('Configuration', userConfigurationSchema);

module.exports = userConfiguration;