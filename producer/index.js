const express = require("express");
const { Sequelize, json } = require("sequelize");
const sequelize = require("sequelize");
const app = express();
let q = "tasks";
let open= require("amqplib").connect(process.env.RABBIT_URI);

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
setTimeout(startUp, 40000);

const sendToQueue = async (msg, res) => {
  try {
    const conn = await open;
    const ch = await open.createChannel();
    await ch.assertQueue(q);
    console.log(msg);
    const result = await ch.sendToQueue(q, Buffer.from(JSON.stringify(msg)));
    console.log(result);
    res.json({ result });
  } catch (error) {
    console.log(error);
  }
};
app.use(express.json());
app.post("/", async (req, res) => {
  await sendToQueue(req.body, res);
});

app.listen(process.env.EXPRESS_PORT);
