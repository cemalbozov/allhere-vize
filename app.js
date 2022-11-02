const express = require("express")
var methodOverride = require('method-override')
const app = express();
const bodyParser = require('body-parser')
const hbs = require("./hbs");



app.use(express.static('public'))

app.use(methodOverride('_method'))

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const main = require("./routes/main")
const users = require("./routes/users")
const account = require("./routes/account")

app.use("/", main)
app.use("/users", users)
app.use("/account", account)





app.listen(process.env.PORT || 3000);