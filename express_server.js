const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "user1111": {
    "id": "user1111",
    "email": "user1111@gmail.com",
    "password": "pass1111"
  },
  "user2222": {
    "id": "user2222",
    "email": "user2222@gmail.com",
    "password": "pass2222"
  }
};

// app.get("/", (req, res) => {
//   res.end("Hello!");
// });

// Get response from clicking a register button. Leads to a registration page.
app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  };
  res.render("register", templateVars);
});

// Get response leading to index page of all URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
    };
  res.render("urls_index", templateVars);
});

// Get response leading to create new url page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
    };
  res.render("urls_new", templateVars);
});

// Get response to individual url page
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    urls: urlDatabase
    };
  res.render("urls_show", templateVars);
});

// Post response to registering a new user
app.post("/register", (req, res)=> {
  function emailCheck(email) {
    console.log("running email check");
    for (let user in users) {
      console.log("running loop");
      console.log(users[user]["email"]);
      if (users[user]["email"] === email) {
        return true;
      }
    }
    return false;
  }
  if (req.body.email && req.body.password && !emailCheck(req.body.email)) {
    let uniqueID = generateRandomString();
    users[uniqueID] = uniqueID;
    users[uniqueID] = {
                      "id": uniqueID,
                      "email": req.body.email,
                      "password": req.body.password
                    };
    console.log(users);
    res.cookie("username", req.body.email);
    res.cookie("user_id", users.uniqueID);
    res.redirect("urls");
  } else if (!req.body.email || !req.body.password) {
    res.sendStatus(400);
  } else if (emailCheck(req.body.email)) {
    res.sendStatus(400);
  }
});

// Post response to add to URL Database
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`urls/${shortURL}`);
});

// Get response for redirection to full URL
app.get("/u/:shortURL", (req, res) => {
  // console.log(urlDatabase[req.params.shortURL]);
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(`//${longURL}`);
});

// Post response from clicking on delete button.
// Removes entry from urlDatabase.
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Post response from clicking on update button in a url profile page.
// Updates entry in urlDatabase.
app.post("/urls/:id", (req, res) => {
  // console.log(req.body);
  urlDatabase[req.params.id] = req.body.update;
  res.redirect("/urls");
});

app.post("/login", (req, res) =>{
  res.cookie("username", req.body.username);
  // console.log(req.body.username)
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// app.get("/urls.json", (req, res) =>{
//   res.json(urlDatabase);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


function generateRandomString () {
  let str = [];
  const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 7; i++) {
    str.push(alphanumeric[Math.floor(Math.random() * 62)]);
  }
  return str.join("");
}