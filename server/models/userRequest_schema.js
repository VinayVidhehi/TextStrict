const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    sender:{
        required:true,
        type:Number,
    },
    friend:{
        required:true,
        type:Number
    },
    status:{
        required:true,
        type:Number,
        default:0
    }
})

const userRequest = mongoose.model('Request', requestSchema);

module.exports = userRequest;