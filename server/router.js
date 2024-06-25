const mongoose = require("mongoose");
const Configuration = require("./models/userConfiguration_schema");
const Request = require("./models/userRequest_schema");
require('dotenv').config();

mongoose
  .connect(process.env.DB_STRING)
  .then(() => console.log("Connected to db"));

const handleUserConfiguration = async (req, res) => {
  const { key, name } = req.body;
  try {
    const foundUser = await Configuration.findOne({key:key});

    if (foundUser) {
      return res.json({
        message: "user key already exists please choose a new key",
        key: 2,
      });
    } else {
      const newCredentials = new Configuration({
        key,
        name,
      });

      await newCredentials.save();

      res.json({ message: "user key saved securely", key: 1 });
    }
  } catch (error) {
    console.log(
      "error while configuring user key, try again later",
      error.message
    );
  }
};

const fetchRequestedUsers = async (req, res) => {
  
  const {userKey} = req.query;
  try{
    const response = await Request.find({friend:userKey, status:0});
  if(response != null || response != undefined) {
    return res.json({message:"requests retireived successfully", key:1, users:response})
  } else {
    return res.json({message:'sorry my friend you have no requests', key:2});
  }
  } catch(error) {
    console.log("error while fetching requests to myself. ", error.message);
    return res.json({message:"unable to retreive users who have requested you", key:0});
  }
}

const removeUserFromRequestList = async(req, res) => {
  const {userKey} = req.query;
  try{
    //find all the users who has accepted the sent follow request 
    const response = await Request.find({sender:userKey, status:1});

    if(response != null || response != undefined) {
      //delete document from the collection
      //do this findone and delete multiple times until the complete array is deleted, in case
      await Request.deleteMany({sender:userKey, status:1});
      return res.json({message:"yes you have got someone who has accepted my request", key:1, users:response});
    }
    else {
      return res.json({message:"no nobody has accepted your request", key:2});
    }
  } catch(error) {
    console.log("error while getting list of those to whom you have sent request");
    return res.json({message:"unable to know who have accepted your request", key:0});
  }
}

const findUser = async(req, res) => {
  console.log("i am here at finduser")
  const {user, sender} = req.body;
  const response = await Configuration.findOne({key:user});

  if(response != null || response != undefined) {
    const isRequest = await Request.findOne({friend:user, sender});
    if(isRequest) {
      return res.json({message:"request to the user already sent", key:2});
    } else {
      return res.json({message:"user found succesfully", key:1, user:response});
    }
  } else {
    return res.json({message:"no user found, can't scam us bruh", key:0});
  }
}

const sendFollowRequest = async(req, res) => {
  const {sender, friend} = req.body;
  console.log("sender and friend is",sender,friend)
  const response = await Request.findOne({sender, friend})
  if(response) {
    res.json({message:"request already sent to the user", key:2})
  } else {
    const requestFriend = new Request({
      sender,
      friend,
      status:0,
    });
  
    await requestFriend.save();
    res.json({message:"request to your friend sent successfully", key:1})
  } 
}

const userRequestAccepted = async(req, res) => {
  const {friendId, userId} = req.body;
  const response = await Request.findOne({sender:friendId, friend:userId});
  console.log("response is ", response, friendId, "friend id is above", "sender id", userId);
  if(response != null || response != undefined) {
    const updatedRelation = {
      sender:friendId,
      friend:userId,
      status:1 
    }
    await Request.findOneAndUpdate({sender:friendId, friend:userId}, updatedRelation);
    return res.json({message:"status updated to friends but not notified", key:1})
  }
}

module.exports = {handleUserConfiguration, fetchRequestedUsers, removeUserFromRequestList, findUser, sendFollowRequest, userRequestAccepted};