const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const generateRandomString = require("./random"); // generateRandomString
const { object2disk, disk2object } = require("./object2disk"); // write to disk
const PORT = 8080; // default port 8080


// middleware
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.set('trust proxy', 1); // trust first proxy
app.use(cookieSession({
  name: 'session',
  keys: ['timhortons', 'Going there to order a double double'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


// ##### URL data base disk retrieve #####
const urlDatabase = disk2object("urlDatabase.json"); // retrieve the object from disk  and convert it to a javascript object

/*  email":"elonmusk@tesla.com","password": "elon123"
    email":"billgates@microsoft.com", "password": "bill123"
    "email":"jeff@amazon.com"","password": "besos123"
    "email":"alicia@gmail.com","password": "silverstone"
    "email":"billyidol@gmail.com","password": "rockstar"
*/
    
// ##### users database disk retrieve #####
const usersDatabase = disk2object("usersDatabase.json"); // retrieve the object from disk  and convert it to a javascript object


// ##### /login route - login page #####
app.get("/login", (req, res) => { // GET login
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("login", templateVars);
});


app.post("/login", (req, res) => { // POST /login
  const formUserEmail = req.body.email;
  const formUserPassword = req.body.password;
  const validUser = checkCredentials(formUserEmail, formUserPassword);
  if (validUser) {
    console.log("usersDatabase", usersDatabase[validUser].id);
    req.session.userID = usersDatabase[validUser].id;
    res.redirect("/urls");
    res.end();
  } else {
    res.status(403).send("<h1>Invalid email or password</h1>");
    res.end();
  }
});


// ##### /logout - button #####
app.post("/logout", (req, res) => { // POST logout erase cookie
  req.session = null;
  res.redirect("/urls");
});



// ##### /urls - main page #####
app.get("/urls", (req, res) => {
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  if (validId === false) { // if the user is not logged in
    res.redirect("/first");
    res.end();
  }
  const userUrls = {};
  for (let url in urlDatabase) {// sends only the urls that the user owns
    if (urlDatabase[url].userID === validId) {
      userUrls[url] = urlDatabase[url];
    }
  }
  const templateVars = { "user_id": validId, "user_email": validEmail, "urls": userUrls };
  res.render("urls_index", templateVars);
});


// ##### /register route - registration page #####
app.get("/register", (req, res) => { // GET register page
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("register", templateVars);
});


app.post("/register", (req, res) => { // POST form from register page
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  if (newEmail === "" || newPassword === "") { 
    res.status(400).send("Please enter a valid email and password");
  } // if the email or password is empty
  for (let user in usersDatabase) {
    if (usersDatabase[user].email === newEmail) {
      res.status(400).send("Email already in use");
      return; // if the email is already in use
    }
  }
  const newUserId = generateRandomString(6);
  const encryptedPassword = bcrypt.hashSync(newPassword, 10);
  usersDatabase[newUserId] = {
    "id": newUserId,
    "email": newEmail,
    "password": encryptedPassword
  };
  object2disk(usersDatabase, "usersDatabase.json"); // write to disk
  req.session.userID = newUserId; // set cookie session
  res.redirect("/urls"); // redirect to the urls page
  res.end();
});


// ##### /urls/new - Creates a new tiny link #####
app.get("/urls/new", (req, res) => { // GET new link page
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => { // POST form with new URL link
  const newUserKey = generateRandomString(6); // generate a user key
  const validId = req.session.userID ? req.session.userID : false;
  urlDatabase[newUserKey] = {
    longURL: req.body.longURL,
    userID: validId
  }; // add the new URL to the database
  object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
  res.redirect("/urls");  // Redirect to the index page
});


// ##### Erase/ Delete tiny urls #####
app.post("/urls/*/delete", (req, res) => { // post button delete url
  const validId = req.session.userID ? req.session.userID : false;
  if (validId === urlDatabase[req.params[0]].userID) {
    delete urlDatabase[req.params[0]]; // delete user's url by user
    object2disk(urlDatabase, "urlDatabase.json"); // save the database to disk
    res.redirect("/urls");
  } else {
    res.status(403).send("<h1>You are not authorized to delete this URL</h1>");
  }
});


// ##### Go to the long URL Call #####
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) { // check if the longURL is a valid URL
    res.redirect(longURL); // go outside
    res.end();
  } else {
    res.redirect("/notfound");
    res.end();
  }
});


// ##### search for specific URL #####
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const validId = req.session.userID ? req.session.userID : false;
    const validEmail = req.session.userID ? usersDatabase[validId].email : false;
    const templateVars = {
      "user_id": validId,
      "user_email": validEmail,
      "shortURL": req.params.shortURL,
      "longURL": urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
    res.end();
  } else {
    res.redirect("/notfound");
    res.end();
  }
});


// ##### /urls/edit route - Update/ Edit links #####
app.get("/urls/edit/:shortURL", (req, res) => { // GET page to edit the link
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  if (validId === urlDatabase[req.params.shortURL].userID) {
    const templateVars = { // send the user's info requested by the own
      "user_id": validId,
      "user_email": validEmail,
      "shortURL": req.params.shortURL,
      "longURL": urlDatabase[req.params.shortURL].longURL};
    res.render("urls_edit", templateVars);
    res.end();
  } else {
    res.redirect("/urls"); // if the user is not the owner of the link
    res.end();
  }
});

app.post("/urls/edit/:shortURL", (req, res) => { // POST Edit form
  const validId = req.session.userID ? req.session.userID : false;
  if (validId === urlDatabase[req.params.shortURL].userID) { //Update the link
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
    res.end();
  } else { // if the user is not the owner of the link
    res.status(403).send("<h1>You are not authorized to edit this URL</h1>");
  }
});


// ##### Page log in First #####
app.get('/first', (req, res) => {
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.status(401).render("first", templateVars);
  res.end();
});

// ##### page 404 #####
app.get('*', (req, res) => {
  const validId = req.session.userID ? req.session.userID : false;
  const validEmail = req.session.userID ? usersDatabase[validId].email : false;
  const templateVars = { "user_id": validId, "user_email": validEmail };
  res.status(404).render("urls_404", templateVars);
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// ##### Functions Helper #####
const checkCredentials = (email, password) => {
  for (let user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      if (bcrypt.compareSync(password, usersDatabase[user].password)) {
        console.log("user found",user);
        return user;
      }
    }
  }
  return false;
};