const express = require("express");
const mongoose = require("mongoose");
const app = express();

const startUp = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const User = mongoose.model(
      "user",
      mongoose.Schema({
        name: String,
        email: String,
        password: String,
      })
    );
    let q = "tasks";
    let open = require("amqplib").connect(process.env.RABBIT_URI);

    // Consumer
    const conn = await open;
    open
      .then(function (conn) {
        console.log("Consumer: Connected to RabbitMQ");
      })
      .catch(console.warn);
    const ch = await conn.createChannel();
    ch.assertQueue(q).then(function (ok) {
      return ch.consume(q, async function (msg) {
        if (msg !== null) {
          console.log(msg.content.toString());
          const user = new User(JSON.parse(msg.content.toString()))
          await user.save()
          ch.ack(msg);
        }
      });
    });
  } catch (error) {
    console.warn(error);
  }
};
setTimeout(startUp, 40000);
app.use(express.json());
app.get("/", () => {
  res.json({
    message: "hello from consumer",
  });
});

app.listen(process.env.EXPRESS_PORT);
