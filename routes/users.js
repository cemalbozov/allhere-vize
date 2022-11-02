const express = require("express")
const router = express.Router()
const { json } = require("body-parser")


router.get('/register', (req, res) => {
    res.render('register')
})

router.get('/login', (req, res) => {
    res.render('login')
})



router.get('/shopcart', (req, res) => {
    
    res.render("shopcart")
            

})



module.exports = router;