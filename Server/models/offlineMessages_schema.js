const mongoose = require("mongoose");

const OfflineMessageSchema = new mongoose.Schema({
    sender:{
        type:String,
        required:true
    },
    friend:{
        type:String,
        required:true
    },
    text:{
        type:String,
        required:true
    },
    key:{
        type:Boolean,
        required:true
    },
});

const OfflineMessage = mongoose.model('OfflineMessage', OfflineMessageSchema);

module.exports = OfflineMessage;