const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 4000;

// New imports
const http = require("http").Server(app);
const cors = require("cors");
const {
  handleUserConfiguration,
  fetchRequestedUsers,
  removeUserFromRequestList,
  findUser,
  sendFollowRequest,
  userRequestAccepted,
  generateKeyPairHandler,
  handleStoreOfflineMessage,
  handleFetchOfflineMessage,
} = require("./router");

app.use(cors());
app.use(bodyParser.json());

let onlineUsers = [];

const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:8081",
  },
});

// Add this before the app.get() block
socketIO.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  socket.on("online", (data) => {
      console.log("data is ", data, typeof(data), socket.id);
      let isFound = false;
      onlineUsers.forEach((user) => {
        if(user.name === data) 
        {
          isFound = true;
        }
      })
      const user = {name:data, id:socket.id};
      if(!isFound){
        onlineUsers.push(user)
        console.log("online users are", onlineUsers)
      }
      socket.broadcast.emit("online_status", {name:data, status:1})
  })

  socket.on("send_messages", (data) => {
    console.log("the received messages are", data)
    socket.broadcast.emit("receive_messages", data);
  })


  socket.on("key_exchange", (data) => {
    console.log("exchanging keys", data);
    socket.broadcast.emit("key_exchange", data)
  })

  socket.on("disconnect", () => {
    onlineUsers.forEach((user) => {
      if(user.id === socket.id) {
        socket.broadcast.emit("online_status", {name:user.name, status:0})
      }
    })
    console.log("online users are",onlineUsers);
    onlineUsers = onlineUsers.filter((user) => user.id != socket.id);
    console.log("online users are",onlineUsers);
    console.log(`User disconnected: ${socket.id} and the new set is ${onlineUsers}`);
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

// state whether the generated key is unique or not
app.post("/api/configure", handleUserConfiguration);
// find a friend with a given key
app.post("/api/find-user", findUser);
// send a follow request to the found user
app.post("/api/request-user", sendFollowRequest);
// friend accepts my request but the sender doesn't know whether I have accepted the request or not
app.post("/api/request-accepted", userRequestAccepted);
//store messages when the friend is offline
app.post("/api/store-offline-message", handleStoreOfflineMessage);

// find all the users who sent me the friend request
app.get("/api/fetch-users", fetchRequestedUsers);
// notify the sender that their friend request was accepted
app.get("/api/request-accepted", removeUserFromRequestList);
//get set of public private keys
app.get("/api/get-key", generateKeyPairHandler);
//get offline messages
app.get("/api/get-offline-messages", handleFetchOfflineMessage);

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

