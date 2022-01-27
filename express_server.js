const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const generateRandomString = require("./random"); // @willianchu random.js
const { object2disk, disk2object } = require("./object2disk"); // @willianchu object2disk.js

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
  res.render("login");
});

app.post("/login", (req, res) => { // <<<<<<<<<<<<<<< POST login
  console.log("login post", req.body);
  const loggedUserEmail = req.body.email;
  const loggedUserPassword = req.body.password; // get the password from the form
  console.log("loggedUserEmail", loggedUserEmail, "loggedUserPassword", loggedUserPassword);
  for (let user in usersDatabase) { // loop through the users database
    if (usersDatabase[user].email === loggedUserEmail && usersDatabase[user].password === loggedUserPassword) { // if the email and password match
      res.cookie("user_id", usersDatabase[user].id); // set cookie
      res.redirect("/urls"); // redirect to the urls page
    }
  }
  res.status(403).send("<h1>email/ password don't mach!</h1>"); // if the email and password don't match
});


// ##### Logout #####
app.post("/logout", (req, res) => { // <<<<<<<<<<<<<<< POST logout erase cook
  console.log("### Logout Post ####");
  console.log(req.body);
  const toDelete = req.cookies["user_id"];
  res.clearCookie(toDelete);
  res.redirect("/urls");
});



// ##### Browse - Beginning of the URL - main page #####
app.get("/urls", (req, res) => {
  console.log("### load index page ###");
  const templateVars = { loggedUserName: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});


// ##### Register #####
app.get("/register", (req, res) => { //>>>>>>>> GET register page
  console.log("### register ###");
  res.render("register");
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
  usersDatabase[newUserId] = { id: newUserId, email: newEmail, password: newPassword };
  //object2disk("usersDatabase.json", usersDatabase);
  console.log("user",usersDatabase);
  res.redirect("/urls");
});


// ##### Write/ Create #####
app.get("/urls/new", (req, res) => { // >>>>>>>>>> GET page
  console.log("### load urls_new ###");
  res.render("urls_new");
}); // >>>>>>>>>> show

app.post("/urls", (req, res) => { // <<<<<<<<<<<<<<<< POST form
  const uniqueKey = generateRandomString(6);
  console.log(">>> post /urls adding a new tiny <<<");
  console.log(uniqueKey, req.body);  // Log the POST request body to the console
  urlDatabase[uniqueKey] = req.body.longURL; // add the new URL to the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");  // Redirect to the index page
});


// ##### Erase/ Delete #####
app.post("/urls/*/delete", (req, res) => { // post <<<<<<<<<<<<<<<< delete
  console.log(">>>> post Delete <<<<<");
  console.log(req.body);  // Log the POST request body to the console
  delete urlDatabase[req.params[0]]; // delete the URL from the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");
});


// ##### Go to the long URL #####
app.get("/u/:shortURL", (req, res) => {
  console.log("Go to the long URL >>>>>>>> external");
  console.log(req.params);
  const longURL = urlDatabase[req.params.shortURL]; // requesting the longURL from the database using the shortURL in the params of the request
  
  console.log(longURL);
  res.redirect(longURL); // go outside
});


// ##### specific URL #####
app.get("/urls/:shortURL", (req, res) => {
  console.log("### Shows Specific URL ####");
  console.log(urlDatabase[req.params.shortURL]);
  const templateVars = { loggedUserName: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});


// ##### Update/ Edit #####
app.get("/urls/edit/:shortURL", (req, res) => { // GET >>>>>>>>>>>>>>>>>
  const index = req.params.shortURL;
  console.log("### Shows EDIT URL ####");
  console.log(index, urlDatabase[req.params.shortURL]);
  const templateVars = { loggedUserName: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_edit", templateVars);
});

app.post("/urls/edit/:shortURL", (req, res) => { // POST <<<<<<<<<<<<<<<< Edit
  console.log("### Edit Post ####");
  console.log(req.params.shortURL, req.body, req.body.shortURL);
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});


// ##### page 404 #####
app.get('*', (req, res) => {
  console.log("### 404 page ####");
  res.status(404);
  res.render("urls_404");
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
