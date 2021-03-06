const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cookieSession = require("cookie-session");

app.use(cookieSession({
  name: "session",
  keys: ["dmfakdmfal"]
}));

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

// Test users and URLs
var urlDatabase = {
  "b2xVn2": {
            "url": "http://www.lighthouselabs.ca",
            "userID": "user1111",
            "birthday": "Fri, 23 Feb 2018 21:45:02 GMT",
            "totalVisits": 0
          },
  "9sm5xK": {
            "url": "http://www.google.com",
            "userID": "user2222",
            "birthday": "Fri, 23 Feb 2018 16:40:02 GMT",
            "totalVisits": 0
          }
};

const users = {
  "user1111": {
    "id": "user1111",
    "email": "user1111@gmail.com",
    "password": bcrypt.hashSync("pass1111", saltRounds)
  },
  "user2222": {
    "id": "user2222",
    "email": "user2222@gmail.com",
    "password": bcrypt.hashSync("pass2222", saltRounds)
  }
};

// ************
// GET REQUESTS
// ************

// Redirects to url index page if logged in, otherwise login page.
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Get response from clicking a register button. Leads to a registration page.
app.get("/register", (req, res) => {
  // Check if client is already logged in, if so, redirects to urls_index
  if (typeof req.session.user_id === "undefined") {
    res.render("register");
  } else {
    let templateVars = {
      user:req.session.user_id,
      urls: personalUrls(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/login", (req, res)=>{
    // Check if client is already logged in, if so, redirects to urls_index
  if (typeof req.session.user_id === "undefined") {
    res.render("login");
  } else {
    let templateVars = {
      user: req.session.user_id,
      urls: personalUrls(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  }
});

// Get response leading to index page of all URLs
app.get("/urls", (req, res) => {
// Checks if client is logged in, and if not, redirects them to log in.
  if (req.session.user_id) {
    let templateVars = {
      user: req.session.user_id,
      urls: personalUrls(req.session.user_id),
      };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).render("login", {"error": "Please login."});
  }
});

// Get response leading to create new url page
app.get("/urls/new", (req, res) => {
// Checks if client is logged in, and if not, redirects them to log in.
  if (req.session.user_id) {
    let templateVars = {
      user: req.session.user_id
      };
    res.render("urls_new", templateVars);
  } else {
    res.status(401).render("login", {"error": "Please login."});
  }
});

// Get response to individual url page
app.get("/urls/:id", (req, res) => {
  // Checks if client is logged in, and if not, redirects them to log in.
  let shortUrl = urlDatabase[req.params.id];
  if (!shortUrl) {
    res.status(404).render("login", {"error": "Page not found."});
  }
  if (req.session.user_id && req.session.user_id.id === shortUrl.userID) {
    let templateVars = {
                        user: req.session.user_id,
                        shortURL: req.params.id,
                        url: shortUrl.url,
                        birthday: shortUrl.birthday,
                        totalVisits: shortUrl.totalVisits
                        };
    res.render("urls_show", templateVars);
  } else {
    res.status(401).render("login", {"error": "Please login."});
  }
});

// Get response for redirection to full URL
app.get("/u/:shortURL", (req, res) => {
  //Checks if the provided shorturl ID is valid and displays default 404 page if not.
  let shortUrl = urlDatabase[req.params.shortURL];
  if (shortUrl) {
    shortUrl.totalVisits++;
    let longUrl = shortUrl.url;
    res.redirect(`${longUrl}`);
  } else {
    res.sendStatus(404);
  }
});

// *************
// POST REQUESTS
// *************

// Post response to registering a new user
app.post("/register", (req, res)=> {
  // Returns true if the given email from registration form already exists in the users object database.
  function emailCheck(email) {
    for (let user in users) {
      if (users[user]["email"] === email) {
        return true;
      }
    }
    return false;
  }
  // Checks if email and password are filled out and verifies if email is alreayd used. Will provide error messages for why the registration might fail
  if (req.body.email && req.body.password && !emailCheck(req.body.email)) {
    let uniqueID = generateRandomString();
    users[uniqueID] = {
                      "id": uniqueID,
                      "email": req.body.email,
                      "password": bcrypt.hashSync(req.body.password, saltRounds)
                    };
    // Generates session cookie for new user
    req.session.user_id = users[uniqueID];
    res.redirect("urls");
  } else if (!req.body.email || !req.body.password) {
    res.status(400).render("register", {"error": "Registration failed due to blank entry."});
  } else if (emailCheck(req.body.email)) {
    res.status(400).render("register", {"error": "Registration failed due to user already existing."});
  }
});

// Post response to add to URL Database
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
                          url: req.body.longURL,
                          userID: req.session.user_id.id,
                          birthday: new Date().toUTCString(),
                          totalVisits: 0
                        };
  res.redirect(`urls/${shortURL}`);
});


// Post response from clicking on delete button.
// Removes entry from urlDatabase.
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id && req.session.user_id.id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else if (!req.session.user_id) {
    res.status(401).render("login", {"error": "Please login."});
  } else {
    res.redirect(401, "/urls");
  }
});

// Post response from clicking on update button in a url profile page.
// Updates entry in urlDatabase.
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id.id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = {"url": req.body.update,
                                 "userID": req.session.user_id.id
                                 };
    res.redirect("/urls");
  } else {
    res.status(403).render("urls", {"error": "Forbidden Request."});
  }
});

app.post("/login", (req, res) =>{
  let currentUser ;
  // Loops through all users comparing email and then password
  // If both match, return true and set currentUser equal to the user they matched
  function loginCheck(email, password) {
    for (let user in users) {
      if (users[user]["email"] === email) {
        if (bcrypt.compareSync(password, users[user].password)) {
          currentUser = users[user];
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }
  if (loginCheck(req.body.email, req.body.password)) {
    req.session.user_id = currentUser;
    res.redirect("/urls");
  } else {
    res.status(403).render("login", {"error": "Login failed."});
  }

});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// *****************
// MODULAR FUNCTIONS
// *****************

// Generates a user's list of personal urls
let personalUrls = (cookie) => {
  let urlList = {};
  for (let urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === cookie.id) {
      urlList[urlID] = urlDatabase[urlID].url;
    }
  }
  return  urlList;
};

// Generates a random string for creating user profiles and shortened URLs
function generateRandomString () {
  let str = [];
  const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 7; i++) {
    str.push(alphanumeric[Math.floor(Math.random() * 62)]);
  }
  return str.join("");
}
