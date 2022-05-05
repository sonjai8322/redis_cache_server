const express = require("express");
const axios = require("axios");


const redis = require('redis');
const redisClient = redis.createClient({
    host: '10.20.0.235',
    port: 6379
});

redisClient.on('error', err => {
    console.log('Error ' + err);
});

const app = express();

app.get("/noredis", async(req, res) => {
    let date = req.query.date;
    let fetch = await axios.get("https://covid19.ddc.moph.go.th/api/Cases/timeline-cases-all");
    let data = fetch.data;
    let result = null;
    data.forEach((element) => {
        if (element.txn_date === date) {
            result = element;
        }
    });
    result ? res.json(result) : res.status(404).json({ result: "Not found" });
});



app.get("/redis/clear", async(req, res) => {
    redisClient.del("coviddata");
    res.json({ result: "ok" });
});


app.get("/redis", async(req, res) => {
    let date = req.query.date;
    redisClient.get("coviddata", async(error, data) => {
        if (error) {
            return res.status(500).send("Internal server error!");
        } else if (data) {
            data = JSON.parse(data);
            let result = null;
            data.forEach((element) => {
                if (element.txn_date === date) {
                    result = element;
                }
            });
            return result ? res.json(result) : res.status(404).json({ result: "Not found!" });
        } else {
            let fetch = await axios.get(
                "https://covid19.ddc.moph.go.th/api/Cases/timeline-cases-all"
            );
            let get = fetch.data;
            // redisClient.set("coviddata", JSON.stringify(get));
            redisClient.setex("coviddata", 30, JSON.stringify(get));
            let result = null;
            get.forEach((element) => {
                if (element.txn_date === date) {
                    result = element;
                }
            });
            return result ? res.json(result) : res.status(404).json({ result: "Not found!" });
        }
    });
});
app.listen(3333, () => {
    console.log("start in port 3333");
});