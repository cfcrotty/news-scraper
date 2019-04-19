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

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useFindAndModify: false });
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
    db.Article.find({ saved: false }, (error, found) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
        } else {
            //res.status(200).render("index", { data: found });
            db.Clothe.find({ saved: false }, (error1, found1) => {
                if (error) {
                    console.log(error);
                    res.status(500).json(error);
                } else {
                    res.status(200).render("index", { data: found, data1: found1 });
                }
            });
        }
    });
});

app.get("/api/clear", (req, res) => {
    mc.dropCollection('articles', (err, data) => {
        mc.dropCollection('notes', (err1, data1) => {
            res.status(200).json("clear");
        });
    });
});

app.get("/api/headlines", (req, res) => {
    db.Article.find({ saved: req.query.saved }, (error, found) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
        } else {
            res.status(200).json(found);
        }
    });
});

app.get("/saved", (req, res) => {
    db.Article.find({ saved: true }, (error, found) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
        } else {
            db.Clothe.find({ saved: true }, (error1, found1) => {
                if (error1) {
                    console.log(error1);
                    res.status(500).json(error1);
                } else {
                    res.status(200).render("saved", { data: found, data1: found1 });
                }
            });
        }
    });
});

app.get("/api/notes/:id", (req, res) => {
    db.Article.findOne({ _id: req.params.id })
        .populate("notes").then(found => {
            res.status(200).json(found.notes);
        }).catch(error => {
            console.log(error);
            res.status(500).json(error);
        });
});

app.delete("/api/notes/:id", (req, res) => {
    db.Article.findOneAndUpdate({ $pull: { notes: req.params.id } })
        .then(found => {
            db.Note.findByIdAndRemove({ _id: req.params.id },
                (error, data) => {
                    if (error) {
                        console.log(error);
                        res.status(500).json(error);
                    } else {
                        res.status(200).json(data);
                    }
                });

        }).catch(error => {
            console.log(error);
            res.status(500).json(error);
        });
});

app.delete("/api/headlines/:id", (req, res) => {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { notes: [], saved: false } })
        .then(found => {
            res.status(200).json({ ok: true });
        }).catch(error => {
            console.log(error);
            res.status(500).json(error);
        });
});

app.post("/api/notes", (req, res) => {
    db.Note.create({ noteText: req.body.noteText.trim() })
        .then(dbNote => {
            return db.Article.findOneAndUpdate({ _id: req.body._headlineId }, { $push: { notes: dbNote._id } }, { new: true });
        })
        .then(found => {
            res.status(200).json(found);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json(error);
        });
});

app.put("/api/headlines/:id", (req, res) => {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    });
});

app.get("/api/fetch", (req, res) => {
    axios.get("https://www.nytimes.com").then(response => {
        let $ = cheerio.load(response.data);
        let results = [];

        $("article").each(function (i, element) { //css-6p6lnl css-8atqhb
            let title = $(element).children().find("h2").text().trim();
            let link = $(element).find("a").attr("href").trim();
            let summary = $(element).find("ul").find("li").text().trim();
            if (summary) {
                results.push({
                    title: title,
                    link: "https://www.nytimes.com/" + link,
                    summary: summary,
                    type: "nyt"
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
    }).catch(error => {
        console.log(error);
        res.status(500).json(error);
    });
});
//-----------------------------------------------Zaful
app.get("/api/fetch/clothes", (req, res) => {
    console.log("/api/fetch/clothes");
    var dressCount = 0;
    axios.get("https://www.zaful.com/dresses-e_5/?innerid=6002&policy_key=B").then(response => {
        console.log("/api/fetch/clothes-------axios");
        let $ = cheerio.load(response.data);
        let results = [];
        $(".img-hover-wrap .js_list_link").each(function (i, element) {
            //if (dressCount < 5) {
                let title = $(element).attr("title").trim();
                let summary = $(element).children().attr("data-original").trim();
                let link = $(element).attr("href").trim();
                results.push({
                    summary: summary,
                    title: title,
                    link: link
                });
                dressCount++;
            //}
        });

        db.Clothe.create(results)
            .then(result => {
                console.log("/api/fetch/clothes------------create");
                res.status(200).json(result);
            })
            .catch(err => {
                console.log("/api/fetch/clothes------------create----------error");
                res.status(500).json(err);
            });

    }).catch(error => {
        console.log("/api/fetch/clothes-----------------error");
        console.log(error);
        res.status(500).json(error);
    });
});

app.get("/api/clothes", (req, res) => {
    db.Clothe.find({ saved: req.query.saved }, (error, found) => {
        if (error) {
            console.log(error);
            res.status(500).json(error);
        } else {
            res.status(200).json(found);
        }
    });
});

app.get("/api/clear/clothes", (req, res) => {
    mc.dropCollection('clothes', (err, data) => {
        //mc.dropCollection('notes', (err1, data1) => {
        res.status(200).json("clear");
        //});
    });
});

app.put("/api/clothes/:id", (req, res) => {
    db.Clothe.findOneAndUpdate({ _id: req.params.id }, { saved: true }).then((data) => {
        data.saved = true;
        res.status(200).json(data);
    }).catch((err) => {
        res.status(500).json(err);
    });
});

app.delete("/api/clothes/:id", (req, res) => {
    db.Clothe.findOneAndUpdate({ _id: req.params.id }, { $set: { notes: [], saved: false } })
        .then(found => {
            res.status(200).json({ ok: true });
        }).catch(error => {
            console.log(error);
            res.status(500).json(error);
        });
});
//-----------------------------------------------Zaful

// Listen on port 3000
app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});
