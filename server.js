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
const databaseUrl = "scraper";
const collections = ["scrapedData"];


const db = mongojs(databaseUrl, collections);
db.on("error", error => {
    console.log("Database Error:", error);
});

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

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
// Main route (simple Hello World Message)
app.get("/", (req, res) => {
    res.status(200).render("index");
});

app.get("/all", (req, res) => {
    db.scrapedData.find({}, (error, found) => {
        if (error) {
            console.log(error);
        } else {
            res.json(found);
        }
    });
});

app.get("/save", (req, res) => {
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

        // An empty array to save the data that we'll scrape
        let results = [];

        // Select each element in the HTML body from which you want information.
        // NOTE: Cheerio selectors function similarly to jQuery's selectors,
        // but be sure to visit the package's npm page to see how it works
        $("article").each(function (i, element) {

            let title = $(element).children().text();
            let link = $(element).find("a").attr("href");

            // Save these results in an object that we'll push into the results array we defined earlier
            results.push({
                title: title,
                link: link
            });
        });

        db.scrapedData.insert(results);
        res.json(results);
    });
})

// Listen on port 3000
app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});
