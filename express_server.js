const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
            "url": "http://www.lighthouselabs.ca",
            "userID": "user1111"
          },
  "9sm5xK": {
            "url": "http://www.google.com",
            "userID": "user2222"
          }
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
  // Check if client is already logged in, if so, redirects to urls_index
  if (req.cookies.user_id === undefined) {
    let templateVars = {
      user: req.cookies.user_id
    };
    res.render("register", templateVars);
  } else {
    let templateVars = {
      user:req.cookies.user_id,
      urls: urlDatabase
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/login", (req, res)=>{
  // console.log(req.cookies.user_id);
  if (req.cookies.user_id === undefined) {
    let templateVars = {
      user: undefined
    };
    res.render("login", templateVars);
  } else {
    let templateVars = {
      user: req.cookies.user_id,
      urls: urlDatabase
    };
    res.render("urls_index", templateVars);
  }
});

// Get response leading to index page of all URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    user: req.cookies.user_id,
    urls: urlDatabase
    };
  res.render("urls_index", templateVars);
});

// Get response leading to create new url page
app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id) {
    let templateVars = {
      user: req.cookies.user_id
      };
    res.render("urls_new", templateVars);
  } else {
    res.redirect(401, "/login");
  }
});

// Get response to individual url page
app.get("/urls/:id", (req, res) => {

  let templateVars = {
    user: req.cookies.user_id,
    shortURL: req.params.id,
    url: urlDatabase[req.params.id].url
    };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

// Post response to registering a new user
app.post("/register", (req, res)=> {
  //Returns true if the given email from registration form already exists in the users object database.
  function emailCheck(email) {
    // console.log("running email check");
    for (let user in users) {
      if (users[user]["email"] === email) {
        return true;
      }
    }
    return false;
  }
  if (req.body.email && req.body.password && !emailCheck(req.body.email)) {
    // console.log(emailCheck(req.body.email));
    let uniqueID = generateRandomString();
    users[uniqueID] = uniqueID;
    users[uniqueID] = {
                      "id": uniqueID,
                      "email": req.body.email,
                      "password": req.body.password
                    };
    res.cookie("user_id", users[uniqueID]);
    res.redirect("urls");
  } else if (!req.body.email || !req.body.password) {
    res.redirect(400, "/register");
  } else if (emailCheck(req.body.email)) {
    res.redirect(400, "/register");
  }
});

// Post response to add to URL Database
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
                          url: req.body.longURL,
                          userID: req.cookies.user_id.id
                        };
  console.log(urlDatabase);
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
  console.log(req.cookies.user_id.id);
  console.log(urlDatabase[req.params.id].userID);
  if (req.cookies.user_id.id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.redirect(401, "/urls");
  }
});

// Post response from clicking on update button in a url profile page.
// Updates entry in urlDatabase.
app.post("/urls/:id", (req, res) => {
  // console.log(req.body);
  if (req.cookies.user_id.id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = req.body.update;
    res.redirect("/urls");
  } else {
    res.redirect(401, "/urls");
  }
});

app.post("/login", (req, res) =>{
  let currentUser ;
  // Loops through all users comparing email and then password
  // If both match, return true and set currentUser equal to the user they matched
  function loginCheck(email, password) {
    // console.log(email, password);
    for (let user in users) {
      if (users[user]["email"] === email) {
        if (users[user]["password"] === password) {
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
    res.cookie("user_id", currentUser);
    res.redirect("/urls");
  } else {
    res.redirect(403, "/login");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
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
