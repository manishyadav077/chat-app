require("dotenv").config()

const app = require("express")();

const server = require("http").createServer(app);

const PORT = process.env.PORT || 5000

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for private messages
  socket.on("private message", ({ content, to }) => {
    console.log(`Message from ${socket.id}: ${content}`);
    socket.to(to).emit("private message", {
      content,
      from: socket.id,
    });
    const responses = [
      "Interesting question!",
      "I'm not sure, let me think about it.",
      "Can you elaborate on that?",
      "That's a great point!",
      "Let me get back to you on that.",
    ];
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    socket.emit("private message", {
      content: randomResponse,
      from: "AI agent",
    });
  });

  // Join a room (to facilitate one-on-one chat)
  socket.on("join room", (room) => {
    socket.join(room);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

//app.listen(5000, ()=> console.log("Server is active"))

server.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}...`);
});
