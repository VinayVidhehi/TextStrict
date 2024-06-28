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
  generateKeyPair,
} = require("./router");

app.use(cors());
app.use(bodyParser.json());

const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:8081",
  },
});

// Add this before the app.get() block
socketIO.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("client", (data) => {
    console.log(
      `Message from ${data.sender} to ${data.friend}: ${data.text}`
    );
    socketIO.emit(`${data.friend}`, data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
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

// find all the users who sent me the friend request
app.get("/api/fetch-users", fetchRequestedUsers);
// notify the sender that their friend request was accepted
app.get("/api/request-accepted", removeUserFromRequestList);
//get set of public private keys
app.get("/api/get-key", generateKeyPair);

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
