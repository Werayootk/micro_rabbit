const express = require("express");
const { Sequelize } = require("sequelize");
const sequelize = require("sequelize");
const app = express();
let q = "tasks";
let open;

const startUp = async () => {
  try {
    const sequelize = new Sequelize(process.env.PG_URI);
    sequelize.authenticate().then((conn) => {
      console.log("Consumer: Connected to Postgres");
    });
    open = require("amqplib").connect(process.env.RABBIT_URI);
    const conn = await open;
    open
      .then(function (conn) {
        console.log("Consumer: Connected to RabbitMQ");
      })
      .catch(console.warn);
  } catch (error) {
    console.warn(error);
  }
};
setTimeout(startUp, 30000);

const sendToQueue = async (msg, res) => {
  try {
    const conn = await open;
    const ch = open.createChannel();
    await ch.assertQueue(q);
    const result = await ch.sendToQueue(q, Buffer.from(JSON.stringify(msg)));
    console.log(result);
    res.json({ result });
  } catch (error) {
    console.warn(error);
  }
};

app.post("/", async (req, res) => {
  await sendToQueue(req.body, res);
});

app.listen(process.env.EXPRESS_PORT);
