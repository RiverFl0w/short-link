const fs = require("fs");
const axios = require("axios");

module.exports.preventGenerateUrlMultiTime = (request, response, next) => {
  const ip = request.clientIp;
  const userAgent = request.headers["user-agent"];
  const userIndentify = { ip, userAgent };
  let globalVariable = JSON.parse(
    fs.readFileSync(process.cwd() + "/global/variable.json", "utf-8")
  );

  if (
    globalVariable.generatedUrlUsersRecently.some(
      userInfo => JSON.stringify(userInfo) === JSON.stringify(userIndentify)
    )
  ) {
    response.send({ err: "you generate url too fast" });
    return;
  }

  globalVariable.generatedUrlUsersRecently.push(userIndentify);
  fs.writeFileSync(
    process.cwd() + "/global/variable.json",
    JSON.stringify(globalVariable)
  );

  setTimeout(() => {
    globalVariable = JSON.parse(
      fs.readFileSync(process.cwd() + "/global/variable.json", "utf-8")
    );
    globalVariable.generatedUrlUsersRecently.shift();
    fs.writeFileSync(
      process.cwd() + "/global/variable.json",
      JSON.stringify(globalVariable)
    );
  }, 10 * 1000);

  next();
};

module.exports.checkTheCorrectOfUrl = (request, response, next) => {
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

  axios
    .get(url)
    .then(() => {
      request._url = url;
      next();
    })
    .catch(() => {
      response.send({ err: "invalid link" });
      return;
    });
};
