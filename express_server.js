const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const generateRandomString = require("./random"); // @willianchu random.js
const { object2disk, disk2object } = require("./object2disk"); // @willianchu object2disk.js
const bcrypt = require('bcryptjs');

// middleware
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());


// ##### URL data base disk retrieve #####
const urlDatabase = disk2object("urlDatabase.json"); // retrieve the object from disk  and convert it to a javascript object

// ##### users database disk retrieve #####
const usersDatabase = disk2object("usersDatabase.json"); // retrieve the object from disk  and convert it to a javascript object


// ##### Login/ Cookie route #####
app.get("/login", (req, res) => {
  console.log("render login page"); // >>>>>>>>>>>>> GET login page
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  console.log("templateVars delivered", templateVars);
  res.render("login", templateVars);
});


app.post("/login", (req, res) => { // <<<<<<<<<<<<<<< POST login
  console.log("Entered in POST /login (req.body)=", req.body);
  console.log("POST req.body.password", req.body.password);
  const loggedUserEmail = req.body.email;
  const loggedUserPassword = req.body.password; // get the password from the form
  console.log("loggedUserEmail >>>", loggedUserEmail, "loggedUserPassword", loggedUserPassword);
  let encryptIsTrue = false;
  for (let user in usersDatabase) { // loop through the users database
    encryptIsTrue = bcrypt.compareSync(loggedUserPassword, usersDatabase[user].password); // compare the password from the form with the password from the database
    console.log("encryptIsTrue", encryptIsTrue);
    console.log("usersDatabase[user].email", usersDatabase[user].email);
    if (usersDatabase[user].email === loggedUserEmail && encryptIsTrue) { // if the email and password match
      res.cookie("user_id", usersDatabase[user].id); // set cookie
      res.redirect("/urls"); // redirect to the urls page
      res.end();
    }
  }
  res.status(403).send("<h1>email/ password don't mach!</h1>"); // if the email and password don't match
  res.end();
});


// ##### Logout #####
app.post("/logout", (req, res) => { // <<<<<<<<<<<<<<< POST logout erase cook
  console.log("### Logout Post ####");
  res.clearCookie("user_id");
  res.redirect("/urls");
});



// ##### Browse - Beginning of the URL - main page #####
app.get("/urls", (req, res) => {
  console.log("### load index page ###");
  console.log("req.cookies", req.cookies);
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  //look for a valid email using the cookie
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  console.log("validId", validId); // *** update
  if (validId === false) { // if the user is not logged in
    res.redirect("/first");
    res.end();
  }
  // sends only the urls that the user owns
  const userUrls = {};
  for (let url in urlDatabase) {
    console.log(urlDatabase[url].userID,validId);
    if (urlDatabase[url].userID === validId) {
      userUrls[url] = urlDatabase[url];
    }
  }
  console.log("userUrls", userUrls);
  const templateVars = { "user_id": validId, "user_email": validEmail, "urls": userUrls };
  res.render("urls_index", templateVars);
});


// ##### Register #####
app.get("/register", (req, res) => { //>>>>>>>> GET register page
  console.log("### register ###");
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("register", templateVars);
});


app.post("/register", (req, res) => { // <<<<<<<<<<<< POST form has a body
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  if (newEmail === "" || newPassword === "") {
    res.status(400).send("Please enter a valid email and password");
  }

  // check if email is already in use in users database
  for (let user in usersDatabase) {
    if (usersDatabase[user].email === newEmail) {
      res.status(400).send("Email already in use");
      return;
    }
  }
  const newUserId = generateRandomString(6);
  console.log("Register valid");
  console.log(newUserId, newEmail, newPassword);
  const encryptedPassword = bcrypt.hashSync(newPassword, 10);
  usersDatabase[newUserId] = { "id": newUserId, "email": newEmail, "password": encryptedPassword };
  object2disk(usersDatabase, "usersDatabase.json");
  console.log("user",usersDatabase);
  res.redirect("/urls");
});


// ##### Write/ Create #####
app.get("/urls/new", (req, res) => { // >>>>>>>>>> GET page
  console.log("### load urls_new ###");
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("urls_new", templateVars);
}); // >>>>>>>>>> show

app.post("/urls", (req, res) => { // <<<<<<<<<<<<<<<< POST form
  const uniqueKey = generateRandomString(6);
  const validId = req.cookies["user_id"];
  console.log(">>> post /urls adding a new tiny <<<");
  console.log(uniqueKey, req.body);  // Log the POST request body to the console
  urlDatabase[uniqueKey] = { longURL: req.body.longURL, userID: validId}; // add the new URL to the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");  // Redirect to the index page
});


// ##### Erase/ Delete #####
app.post("/urls/*/delete", (req, res) => { // post <<<<<<<<<<<<<<<< delete
  console.log(">>>> post Delete <<<<<");
  console.log(req.body);  // Log the POST request body to the console
  const validId = req.cookies["user_id"];
  if (validId === urlDatabase[req.params[0]].userID) {
    delete urlDatabase[req.params[0]]; // delete the URL from the database
    object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
    res.redirect("/urls");
  } else {
    res.status(403).send("<h1>You are not authorized to delete this URL</h1>");
  }
});


// ##### Go to the long URL #####
app.get("/u/:shortURL", (req, res) => {
  console.log("Go to the long URL >>>>>>>> external");
  console.log(req.params);
  const longURL = urlDatabase[req.params.shortURL].longURL; // requesting the longURL from the database using the shortURL in the params of the request
  // check if the longURL is a valid URL
  if (longURL) {
    console.log(longURL);
    res.redirect(longURL); // go outside
  } else {
    res.redirect("/notfound");
  }
});


// ##### specific URL #####
app.get("/urls/:shortURL", (req, res) => {
  console.log("### Shows Specific URL ####");
  console.log("parameters",req.params.shortURL);
  if (urlDatabase[req.params.shortURL]) {
    const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
    const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
    const templateVars = { "user_id": validId, "user_email": validEmail, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/notfound");
  }
});


// ##### Update/ Edit #####
app.get("/urls/edit/:shortURL", (req, res) => { // GET >>>>>>>>>>>>>>>>>
  const index = req.params.shortURL;
  console.log("### Shows EDIT URL ####");
  console.log(index, urlDatabase[req.params.shortURL]);
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  if (validId === urlDatabase[req.params.shortURL].userID) {
    const templateVars = { "user_id": validId, "user_email": validEmail, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL};
    res.render("urls_edit", templateVars);
  } else {
    res.redirect("/urls");
  };
});

app.post("/urls/edit/:shortURL", (req, res) => { // POST <<<<<<<<<<<<<<<< Edit
  console.log("### Edit Post ####");
  console.log(req.params.shortURL, req.body, req.body.shortURL);
  const validId = req.cookies["user_id"];
  if (validId === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
    res.end();
  } else {
    res.status(403).send("<h1>You are not authorized to edit this URL</h1>");
  }
});


// ##### page log in First #####
app.get('/first', (req, res) => {
  console.log("### log in first page ####");
  // status denied
  res.status(401);
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("first", templateVars);
  res.end();
});

// ##### page 404 #####
app.get('*', (req, res) => {
  console.log("### 404 page ####");
  res.status(404);
  const validId = req.cookies["user_id"] ? req.cookies["user_id"] : false;
  const validEmail = req.cookies["user_id"] ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("urls_404", templateVars);
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
