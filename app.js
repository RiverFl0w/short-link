const express = require("express");
const app = express();
const PORT = 8888;
const __domain = "http://localhost:" + PORT + "/";

const nedb = require("nedb");
const bodyParser = require("body-parser");
const generator = require("./string-generator");
const requestIp = require("request-ip");
const axios = require('axios');

// const restrictMiddleWare = require("./middleware/restrict.middleware");

app.use(express.static("views"));
app.use("/public", express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestIp.mw());

let generatedUrlUsersRecently = [];
const db = new nedb("./database/linkDB");
db.loadDatabase();

//show all shorten url
app.get("/get/short-link-storage", (request, response) => {
  db.find({}, (err, data) => {
    if (err) throw err;
    response.send(data);
  });
});

//go to origin url
app.get("/:shortUrl", (request, response) => {
  const shortUrl = __domain + request.params.shortUrl;
  db.find({ shortedUrl: shortUrl }, (err, data) => {
    if (err) throw err;
    if (data[0] == undefined) {
      response.end();
      return;
    }
    response.redirect(data[0].url);
  });
});

app.post(
  "/post/short-link-generator",
  //prevent generate multi time
  (request, response, next) => {
    const ip = request.clientIp;
    const userAgent = request.headers["user-agent"];

    if (
      generatedUrlUsersRecently.some(
        userInfo => JSON.stringify(userInfo) === JSON.stringify({ ip, userAgent })
      )
    ) {
      response.send({ err: "you generate url too fast" });
      return;
    }

    generatedUrlUsersRecently.push({ ip, userAgent });
    setTimeout(() => {
      generatedUrlUsersRecently.shift();
    }, 10 * 1000);

    next();
  },
  //checking the correct of url
  (request, response, next) => {
    let url = request.body.link;
    if (!url) {
      response.send({ err: "link must be fill" });
      return;
    }
    if (!/[\.]/.test(url) || /[\s\\<>{}]/.test(url)) {
      response.send({ err: "invalid link" });
      return;
    }
    if (!/(http)s?(:\/\/)/.test(url)) {
      url = "http://" + url;
    }

    axios.get(url)
      .then(() => {
        request._url = url;
        next();
      })
      .catch(() => {
        response.send({ err: "invalid link" });
        return;
      })
  },
  //add url to database
  (request, response) => {
    const url = request._url;
    const shortedUrl = __domain + generator(6);
    db.insert({ url, shortedUrl }, (err, newData) => {
      if (err) throw err;
    });

    response.redirect("/");
  }
);

app.listen(PORT, (err, res) => {
  if (err) throw err;
  console.log("server listening port: " + PORT);
});
