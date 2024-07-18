const mongoose = require("mongoose");

const userConfigurationSchema = new mongoose.Schema({
  publicKey: {
    n: {
      type: String,
      required: true,
      unique: true,
    },
    e: {
      type: String,
      required: true,
      unique: true,
    },
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const UserConfiguration = mongoose.model(
  "UserConfiguration",
  userConfigurationSchema
);

module.exports = UserConfiguration;
