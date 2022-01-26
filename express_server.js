const generateRandomString = require("./random"); // @willianchu random.js
const { object2disk, disk2object } = require("./object2disk"); // @willianchu object2disk.js
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser"); // pull information from HTML POST (express4) - must be installed npm install body-parser

app.use(bodyParser.urlencoded({extended: true})); // set parse application/x-www-form-urlencoded - this must become before all off our routes (req.body.longURL)

app.set("view engine", "ejs"); // set ejs as the view engine - must be installed npm install ejs

const urlDatabase = disk2object("urlDatabase.json"); // retrieve the object from disk  and convert it to a javascript object

app.get("/urls/new", (req, res) => { // GET form doesn't have a body
  res.render("urls_new");
});


// ##### Browse - Beginning of the URL #####
// #########################################
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// ##### Write/ Create #####
// #########################
app.post("/urls", (req, res) => {
  const uniqueKey = generateRandomString(6, urlDatabase);
  console.log(uniqueKey, req.body);  // Log the POST request body to the console
  urlDatabase[uniqueKey] = req.body.longURL; // add the new URL to the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");  // Redirect to the index page
});

// ##### Erase/ Delete #####
// #########################
app.post("/urls/*/delete", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  delete urlDatabase[req.params[0]]; // delete the URL from the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");
});


// ##### Go to the long URL #####
// ##############################
app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  console.log(req.params);
  const longURL = urlDatabase[req.params.shortURL]; // requesting the longURL from the database using the shortURL in the params of the request
  
  console.log(longURL);
  res.redirect(longURL); // go outside 
});


// ##### specific URL #####
// #########################
app.get("/urls/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_edit", templateVars);
});

// ##### Update/ Edit #####
// #########################
app.get("/urls/edit/:idx", (req, res) => {
  const index = req.params.idx;
  const templateVars = { shortURL: index, longURL: urlDatabase[index] };
  res.render("urls_edit", templateVars);
});

app.post("/urls/edit/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
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


// app.get("/hello", (req, res) => {
//   const templateVars = { greeting: 'Hello World!' };
//   res.render("hello_world", templateVars);
// });
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });
// app.get("/urls.json", (req, res) => { // json path
//   res.json(urlDatabase);
// });