// Dependencies
const express = require("express");
const mongojs = require("mongojs");
const mongoose = require("mongoose");
// Require axios and cheerio. This makes the scraping possible
const axios = require("axios");
const cheerio = require("cheerio");
const exphbs = require("express-handlebars");
const app = express();
const PORT = process.env.PORT || 3000;

// Require all models
const db = require("./models");

// const databaseUrl = "scraper";
// const collections = ["scrapedData"];
// const db = mongojs(databaseUrl, collections);
// db.on("error", error => {
//     console.log("Database Error:", error);
// });

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);
var mc = mongoose.connection;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main"
    })
);
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
    db.Article.find({}, (error, found) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
        } else {
            res.status(200).render("index",{data: found});
        }
    });
});

app.get("/api/clear", (req, res) => {
    mc.dropCollection('articles',(err,data)=>{
        res.status(200).json("clear");
    });
});

app.get("/api/headlines", (req, res) => {
    let flag = false;
    if (req.body.saved) flag=true;
    db.Article.find({}, (error, found) => {
        if (error) {
            console.log(error);
        } else {
            res.json(found);
        }
    });
});

app.get("/api/fetch", (req, res) => {
    // axios.get("https://www.zaful.com/dresses-e_5/?innerid=6002&policy_key=B").then(response => {
    //     let $ = cheerio.load(response.data);
    //     let results = [];
    //     $(".img-hover-wrap .js_list_link").each(function (i, element) {
    //         let title = $(element).attr("title");
    //         let link = $(element).children().attr("data-original");
    //         results.push({
    //             link: link,
    //             title: title
    //         });
    //     });
    //     db.scrapedData.insert(results);
    //     res.json(results);
    // });

    axios.get("https://www.nytimes.com").then(response => {
        let $ = cheerio.load(response.data);
        let results = [];

        $(".css-6p6lnl").each(function (i, element) { //css-8atqhb
            //let title = $(element).children().text();
            //let title = $(element).find("span").text();
            //let link = $(element).find("a").attr("href");

            let title = $(element).find("h2").text();
            let summary = $(element).find("ul").find("li").text();
            let link = $(element).find("a").attr("href");
            if (summary) {
                results.push({
                    title: title,
                    link: link,
                    summary: summary
                });
            }
        });

        db.Article.create(results)
            .then(results => {
                res.status(200).json(results);
            })
            .catch(err => {
                res.status(500).json(err);
            });
        // console.log(results);
        // res.send("test");
    });
})

// Listen on port 3000
app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});
