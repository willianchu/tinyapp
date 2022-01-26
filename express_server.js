const generateRandomString = require("./random"); // @willianchu random.js
const { object2disk, disk2object } = require("./object2disk"); // @willianchu object2disk.js
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser"); // pull information from HTML POST (express4) - must be installed npm install body-parser
const cookieParser = require('cookie-parser'); // pull information from HTML POST depends on npm install body-parser (combo of body-parser and cookie-parser) API


app.use(bodyParser.urlencoded({extended: true})); // set parse application/x-www-form-urlencoded - this must become before all off our routes (req.body.longURL)

app.set("view engine", "ejs"); // set ejs as the view engine - must be installed npm install ejs

app.use(cookieParser()); // set cookieParser as the view engine

const urlDatabase = disk2object("urlDatabase.json"); // retrieve the object from disk  and convert it to a javascript object

/* cookie example
app.get('/', function (req, res) {
  // Cookies that have not been signed
  console.log('Cookies: ', req.cookies)

  // Cookies that have been signed
  console.log('Signed Cookies: ', req.signedCookies)
})
*/
// ##### Login/ Cookie route #####
app.post("/login", (req, res) => {
  const loggedUserName = req.body.userName;
  // parse body of request
  console.log("set a cookie", req.body);
  res.cookie(loggedUserName); // set cookie
  // const user = req.body.username;
  // const password = req.body.password;
  // const userDatabase = disk2object("users.json");
  // const userFound = userDatabase[user];
  // if (userFound && userFound.password === password) {
  //   res.cookie("username", user, {maxAge: 3600000});
  const templateVars = { "loggedUserName": loggedUserName, urls: urlDatabase };
  res.render("urls_index", templateVars);
  // } else {
  //   res.status(403).send("<h1>403 Forbidden</h1>"); // create a 403 Forbidden in 404 page
  // }
});



// ##### Browse - Beginning of the URL #####
// #########################################
app.get("/urls", (req, res) => {
  console.log("### load index page ###");
  const templateVars = { loggedUserName: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// ##### Write/ Create #####
// #########################
app.get("/urls/new", (req, res) => { // GET form doesn't have a body
  console.log("### load urls_new ###");
  res.render("urls_new");
}); // >>>>>>>>>> show

app.post("/urls", (req, res) => { // <<<<<<<<<<<<<<<< write
  const uniqueKey = generateRandomString(6, urlDatabase);
  console.log(">>> post /urls adding a new tiny <<<");
  console.log(uniqueKey, req.body);  // Log the POST request body to the console
  urlDatabase[uniqueKey] = req.body.longURL; // add the new URL to the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");  // Redirect to the index page
});

// ##### Erase/ Delete #####
// #########################
app.post("/urls/*/delete", (req, res) => { //<<<<<<<<<<<<<<<< delete
  console.log(">>>> post Delete <<<<<")
  console.log(req.body);  // Log the POST request body to the console
  delete urlDatabase[req.params[0]]; // delete the URL from the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");
});


// ##### Go to the long URL #####
// ##############################
app.get("/u/:shortURL", (req, res) => {
  console.log("Go to the long URL >>>>>>>> external");
  console.log(req.params);
  const longURL = urlDatabase[req.params.shortURL]; // requesting the longURL from the database using the shortURL in the params of the request
  
  console.log(longURL);
  res.redirect(longURL); // go outside
});


// ##### specific URL #####
// #########################
app.get("/urls/:shortURL", (req, res) => {
  console.log("### Shows Specific URL ####");
  console.log(urlDatabase[req.params.shortURL]);
  const templateVars = { loggedUserName: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// ##### Update/ Edit #####
// #########################
app.get("/urls/edit/:shortURL", (req, res) => {
  const index = req.params.shortURL;
  console.log("### Shows EDIT URL ####");
  console.log(index, urlDatabase[req.params.shortURL]);
  const templateVars = { loggedUserName: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_edit", templateVars);
});

app.post("/urls/edit/:shortURL", (req, res) => {
  console.log("### Update req ####");
  console.log(req.params.shortURL, req.body, req.body.shortURL);
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});


// ##### Logout #####
// #################
app.post("/logout", (req, res) => {
  console.log("### Logout req ####");
  console.log(req.body);
  const toDelete = req.cookies["username"];
  res.clearCookie("username");
  // res.redirect("/urls");
});


// ##### page 404 #####
// ###################
app.get('*', (req, res) => {
  res.status(404);
  res.render("urls_404");
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
