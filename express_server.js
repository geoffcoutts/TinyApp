const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// app.get("/", (req, res) => {
//   res.end("Hello!");
// });

// Get response leading to index page of all URLs
app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

// Get response leading to create new url page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Get response to individual url page
app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id,
                      urls: urlDatabase
                     };
  res.render("urls_show", templateVars);
});


// Post response to add to URL Database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

// Post response from clicking on delete button. Removes entry from urlDatabase.
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("http://localhost:8080/urls");
});

// Post response from clicking on update button. Updates entry in urlDatabase.
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.update;
  res.redirect("http://localhost:8080/urls");
});

// Get response for redirection to full URL
app.get("/u/:shortURL", (req, res) => {
  // console.log(urlDatabase[req.params.shortURL]);
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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