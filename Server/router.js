const mongoose = require("mongoose");
const UserConfiguration = require("./models/userConfiguration_schema");
const Request = require("./models/userRequest_schema");
const OfflineMessage = require("./models/offlineMessages_schema");
const crypto = require('crypto');
const util = require('util');
const generateKeyPair = util.promisify(crypto.generateKeyPair);
require("dotenv").config();

mongoose
  .connect(process.env.DB_STRING)
  .then(() => console.log("Connected to db"));

const handleUserConfiguration = async (req, res) => {
  const { key, name } = req.body;
  try {
    const foundUser = await UserConfiguration.findOne({ key: key });

    if (foundUser) {
      return res.json({
        message: "user key already exists please choose a new key",
        key: 2,
      });
    } else {
      const newCredentials = new UserConfiguration({
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
  const { sender } = req.query;
  try {
    const response = await Request.find({ friend: sender, status: 0 });
    if (response != null || response != undefined) {
      return res.json({
        message: "requests retireived successfully",
        key: 1,
        users: response,
      });
    } else {
      return res.json({
        message: "sorry my friend you have no requests",
        key: 2,
      });
    }
  } catch (error) {
    console.log("error while fetching requests to myself. ", error.message);
    return res.json({
      message: "unable to retreive users who have requested you",
      key: 0,
    });
  }
};

const removeUserFromRequestList = async (req, res) => {
  const { sender } = req.query;
  try {
    //find all the users who has accepted the sent follow request
    const response = await Request.find({ sender, status: 1 });

    if (response != null || response != undefined) {
      //delete document from the collection
      //do this findone and delete multiple times until the complete array is deleted, in case
      await Request.deleteMany({ sender, status: 1 });
      //here i want to find the friends public key in the userconfiguration collection so as to know his public key
      const friendsWithPublicKeys = await Promise.all(
        response.map(async (request) => {
          const friend = await UserConfiguration.findOne({
            name: request.friend,
          });
          return {
            ...request.toObject(),
            name: friend ? friend.name : null,
            publicKey: friend ? friend.publicKey : null,
          };
        })
      );

      return res.json({
        message: "Yes, you have got someone who has accepted your request",
        key: 1,
        users: friendsWithPublicKeys,
      });
    } else {
      return res.json({
        message: "no nobody has accepted your request",
        key: 2,
      });
    }
  } catch (error) {
    console.log(
      "error while getting list of those to whom you have sent request"
    );
    return res.json({
      message: "unable to know who have accepted your request",
      key: 0,
    });
  }
};

//finds user who is of the form {name, publicKey:n}
const findUser = async (req, res) => {
  const { friend, sender } = req.body;
  console.log(
    "i am here at finduser",
    friend,
    typeof friend,
    sender,
    typeof sender
  );
  const response = await UserConfiguration.findOne({ name: friend });

  if (response != null || response != undefined) {
    const isRequest = await Request.findOne({ friend, sender });
    if (isRequest) {
      return res.json({ message: "request to the user already sent", key: 2 });
    } else {
      return res.json({
        message: "user found succesfully",
        key: 1,
        friend: response,
      });
    }
  } else {
    return res.json({ message: "no user found, can't scam us bruh", key: 0 });
  }
};

const sendFollowRequest = async (req, res) => {
  const { sender, friend } = req.body;
  console.log("sender and friend is", sender, friend);
  const response = await Request.findOne({ sender, friend });
  if (response) {
    res.json({ message: "request already sent to the user", key: 2 });
  } else {
    const requestFriend = new Request({
      sender,
      friend,
      status: 0,
    });

    await requestFriend.save();
    res.json({ message: "request to your friend sent successfully", key: 1 });
  }
};

//returns sender:{name, publicKey:n}
const userRequestAccepted = async (req, res) => {
  const { friend, sender } = req.body;
  const response = await Request.findOne({ sender: friend, friend: sender });
  console.log(
    "response is ",
    response,
    friend,
    "friend id is above",
    "sender id",
    sender
  );
  if (response != null || response != undefined) {
    const updatedRelation = {
      sender: friend,
      friend: sender,
      status: 1,
    };
    await Request.findOneAndUpdate(
      { sender: friend, friend: sender },
      updatedRelation
    );
    const requestSenderDetails = await UserConfiguration.findOne({
      name: friend,
    });
    return res.json({
      message: "status updated to friends but not notified",
      key: 1,
      sender: requestSenderDetails,
    });
  }
};

//generates keys and sends it back {d,n,e}
const generateKeyPairHandler = async (req, res) => {
  const { name } = req.query;

  const isUserPresentWithTheGivenName = await UserConfiguration.findOne({ name });
  if (isUserPresentWithTheGivenName) {
    return res.json({
      message: "User with the given name already exists, use a different name",
      key: 2,
    });
  }

  try {
    const { publicKey, privateKey } = await generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: "thequickbrownfoxjumpsoverthelazydog", // Use environment variables for better security
      },
    });

    // Extracting private key components (d, n)
    const privateKeyObj = crypto.createPrivateKey({
      key: privateKey,
      format: 'pem',
      passphrase: "thequickbrownfoxjumpsoverthelazydog",
    });
    const keyDetails = privateKeyObj.export({ format: 'jwk' });

    const n = Buffer.from(keyDetails.n, 'base64').toString('hex');
    const d = Buffer.from(keyDetails.d, 'base64').toString('hex');
    const e = Buffer.from(keyDetails.e, 'base64').toString('hex');

    const newPublicKey = {n, e};
    const findMatchingKey = await UserConfiguration.findOne({ publicKey: newPublicKey});
    if (findMatchingKey) {
      return generateKeyPairHandler(req, res);
    }

    const userConfiguration = new UserConfiguration({
      publicKey:newPublicKey,
      name,
    });

    await userConfiguration.save();

    // Send the public key components back in the response
    res.status(200).json({
      message: "Your key pair is successfully created",
      keys: { n, e, d }, // Sending only n, e, and d
      key: 1,
    });
  } catch (error) {
    console.error('Key Generation Error:', error);
    res.status(500).json({ error: 'Key generation failed', details: error.message });
  }
};

const handleFetchOfflineMessage = async(req, res) => {
  const {sender} = req.query;
  console.log("sender is ", sender);
  const response = await OfflineMessage.find({friend:sender});
  if(response.length>0) {
    console.log("am i here?", response)
    await OfflineMessage.deleteMany({friend:sender});
    return res.json({message:"here are the messages sent to you", key:1, messages:response})
  } else {
    return res.json({message:"no messages sorry!", key:0});
  }
}

const handleStoreOfflineMessage = async(req, res) => {
  const {sender, friend, text, key} = req.body.senderData;

  console.log("sender data ois" ,sender, friend)
  const newOfflineMessage = new OfflineMessage({
    sender,
    friend,
    text,
    key
  });

  const response = await newOfflineMessage.save();
  if(response) {
    res.json({message:"successfully stored text safely in the cloud database", key:1});
  } else {
    res.json({message:"unable to save, please try again later", key:0});
  }
}

module.exports = {
  handleUserConfiguration,
  fetchRequestedUsers,
  removeUserFromRequestList,
  findUser,
  sendFollowRequest,
  userRequestAccepted,
  generateKeyPairHandler,
  handleStoreOfflineMessage,
  handleFetchOfflineMessage,
};
