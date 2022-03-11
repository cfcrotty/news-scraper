// Dependencies
const path = require("path");
const express = require("express");
const mongojs = require("mongojs");
const mongoose = require("mongoose");
// Require axios and cheerio. This makes the scraping possible
const axios = require("axios");
const cheerio = require("cheerio");
const exphbs = require("express-handlebars");
const app = express();
const PORT = process.env.PORT || 3000;
const redis = require("redis");
//let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
//let workQueue = new Queue('work', REDIS_URL);

///mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Require all models
const db = require("./models");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log(" Mongoose is connected")); //, { useFindAndModify: false, useUnifiedTopology: true }
var mc = mongoose.connection;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

app.engine(
    "handlebars",
    exphbs.engine({
        defaultLayout: "main"
    })
);
app.set("view engine", "handlebars");

//Update errors to have more data on it - March 10, 2022
app.get("/", (req, res) => {
    db.Article.find({ saved: false }, (error, found) => {
        if (error) {
            console.log("Error - Article find 1: ", error);
            res.status(500).json(error);
        } else {
            //res.status(200).render("index", { data: found });
            db.Clothe.find({ saved: false }, (error1, found1) => {
                if (error) {
                    console.log("Error - Article find 2: ", error);
                    res.status(500).json(error);
                } else {
                    res.status(200).render("index", { data: found, data1: found1 });
                }
            }).lean();
        }
    }).lean();
});

app.get("/api/clear/:saved", (req, res) => {
    let saved = req.params.saved;
    // db.Article.updateMany({"saved":true}, { $set: { saved: false } })
    // .then(found => {
    //     res.status(200).json("clear");
    // }).catch(error => {
    //     console.log(error);
    //     res.status(500).json(error);
    // });
    //-------To delete the whole articles and notes collections
    // mc.dropCollection('articles', (err, data) => {
    //     mc.dropCollection('notes', (err1, data1) => {
    //         res.status(200).json("clear");
    //     });
    // });

    db.Article.find({"saved":saved},function(err,data){
        if (err) console.log("Error - Article find 1: ", err);
        else {
            if (data.length>0) {
                for(let i=0;i<data.length;i++){
                    let nt = data[i].notes;
                    if (nt.length>0) {
                        db.Note.deleteMany({_id: {$in: nt}})
                        .then(found => {
                            console.log("Success - Article: removed notes");
                        }).catch(error => {
                            console.log("Error - Article find 2: ", error);
                        });
                    }
                }
            }
        }
    }).remove().exec()
    .then(found => {
        res.status(200).json("clear");
    }).catch(error => {
        console.log("Error - Article find 3: ", error);
        res.status(500).json(error);
    });
});

app.get("/api/headlines", (req, res) => {
    db.Article.find({ saved: req.query.saved }, (error, found) => {
        if (error) {
            console.log("Error - App get 1:", error);
            res.status(500).json(error);
        } else {
            res.status(200).json(found);
        }
    }).lean();
});

app.get("/saved", (req, res) => {
    db.Article.find({ saved: true }, (error, found) => {
        if (error) {
            console.log("Error - Article find 1: ", error);
            res.status(500).json(error);
        } else {
            db.Clothe.find({ saved: true }, (error1, found1) => {
                if (error1) {
                    console.log("Error - Clothe find 1: ", error1);
                    res.status(500).json(error1);
                } else {
                    res.status(200).render("saved", { data: found, data1: found1 });
                }
            }).lean();
        }
    }).lean();
});

app.get("/api/notes/:id", (req, res) => {
    db.Article.findOne({ _id: req.params.id })
        .populate("notes").then(found => {
            res.status(200).json(found.notes);
        }).catch(error => {
            console.log("Error - app get notes id 1: ", error);
            res.status(500).json(error);
        });
});

app.delete("/api/notes/:id", (req, res) => {
    db.Article.findOneAndUpdate({ $pull: { notes: req.params.id } })
        .then(found => {
            db.Note.findByIdAndRemove({ _id: req.params.id },
                (error, data) => {
                    if (error) {
                        console.log("Error - Note find id and remove 1: ", error);
                        res.status(500).json(error);
                    } else {
                        res.status(200).json(data);
                    }
                });

        }).catch(error => {
            console.log("Error - Notes find and update 2: ",error);
            res.status(500).json(error);
        });
});

app.delete("/api/headlines/:id", (req, res) => {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { saved: false } })
        .then(found => {
            res.status(200).json({ ok: true });
        }).catch(error => {
            console.log("Error - delete api headlines id 1: ", error);
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
            console.log("Error - app post api notes 1: ", error);
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
       /* async (req, res) => {
            let job = await workQueue.add();
            res.json({ id: job.id });*/
        axios.get("https://www.nytimes.com").then(response => {
            let $ = cheerio.load(response.data);
            let results = [];
    
            //Update elements and classes to match changes in website - March 10, 2022 
            $("section.story-wrapper").each(function (i, element) { //css-6p6lnl css-8atqhb
                if (i>20) {
                    return;
                }
    
                let summary = $(element).find("ul").find("li").text().trim();
    
                if (!summary) summary = $(element).find("p").text().trim();
                
                if (summary) {
                    let title = $(element).children().find("h3").text().trim();
                    let link = $(element).find("a").attr("href");
                    if (link) link = link.trim();
    
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
                    console.log("Success - Article create 1: ",results);
                    res.status(200).json(results);
                })
                .catch(err => {
                    console.log("Error - Article create 1: ",results);
                    res.status(500).json(err);
                });
        }).catch(error => {
            console.log("Error - app get api fetch 1: ", error);
            res.status(500).json(error);
        });
    });
/*app.get("/api/fetch", (req, res) => {
    axios.get("https://www.nytimes.com").then(response => {
        let $ = cheerio.load(response.data);
        let results = [];

        //Update elements and classes to match changes in website - March 10, 2022 
        $("section.story-wrapper").each(function (i, element) { //css-6p6lnl css-8atqhb
            if (i>=1) {
                return;
            }

            let summary = $(element).find("ul").find("li").text().trim();

            if (!summary) summary = $(element).find("p").text().trim();
            
            if (summary) {
                let title = $(element).children().find("h3").text().trim();
                let link = $(element).find("a").attr("href");
                if (link) link = link.trim();

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
                console.log("Success - Article create 1: ",results);
                res.status(200).json(results);
            })
            .catch(err => {
                console.log("Error - Article create 1: ",results);
                res.status(500).json(err);
            });
    }).catch(error => {
        console.log("Error - app get api fetch 1: ", error);
        res.status(500).json(error);
    });
});*/

//-----------------------------------------------Dress.ph
app.get("/api/fetch/clothes", (req, res) => {
    //-----------------------------------------------For Zaful
    //https://www.zaful.com/dresses-e_5/?innerid=6002&policy_key=B https://www.zalora.com.ph/women/clothing/dresses https://dress.ph/cat_60_Casual-Dress/
    // $(".img-hover-wrap .js_list_link").each(function (i, element) {
    //     //if (dressCount < 5) {
    //         let title = $(element).attr("title").trim();
    //         let summary = $(element).children().attr("data-original").trim();
    //         let link = $(element).attr("href").trim();
    //         results.push({
    //             summary: summary,
    //             title: title,
    //             link: link
    //         });
    //         dressCount++;
    //     //}
    // });
    //-----------------------------------------------For Zaful
    //Remove ":81" from http://dress.ph/cat_60_Casual-Dress - March 10, 2022
    axios.get("http://dress.ph/cat_60_Casual-Dress").then(response => {
        let $ = cheerio.load(response.data);
        let results = [];
        
        $(".category-content-list-item").each(function (i, element) {
            if (i>20) {
                return;
            }

            let link = $(element).children("a").attr("href").trim();
            let summary = $(element).children().children("img").attr("data-url").trim();
            let title = $(element).children().children("img").attr("title").trim();
            results.push({
                summary: "http://dress.ph" + summary,
                title: title,
                link: "http://dress.ph" + link
            });
        });

        db.Clothe.create(results)
            .then(result => {
                res.status(200).json(result);
            })
            .catch(err => {
                res.status(500).json(err);
            });

    }).catch(error => {
        console.log("Error - app get api fetch clothes 1: ",  error);
        res.status(500).json(error);
    });
});

app.get("/api/clothes", (req, res) => {
    db.Clothe.find({ saved: req.query.saved }, (error, found) => {
        if (error) {
            console.log("Error -app get api clothes 1: ", error);
            res.status(500).json(error);
        } else {
            res.status(200).json(found);
        }
    }).lean();
});

app.delete("/api/clear/clothes/:saved", (req, res) => {
    let saved = req.params.saved;
    // mc.dropCollection('clothes', (err, data) => {
    //     res.status(200).json("clear");
    // });
    db.Clothe.remove({"saved":saved}).exec()
    .then(found => {
        res.status(200).json("clear");
    }).catch(error => {
        console.log("Error - app delete api clear clothes 1: ", error);
        res.status(500).json(error);
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
    db.Clothe.findOneAndUpdate({ _id: req.params.id }, { $set: { saved: false } })
        .then(found => {
            res.status(200).json({ ok: true });
        }).catch(error => {
            console.log("Error - app delete api clothes 1: ", error);
            res.status(500).json(error);
        });
});
//-----------------------------------------------Dress.ph

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/error.html"));
});

// Listen on port 
app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});
