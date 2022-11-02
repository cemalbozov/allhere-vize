const express = require("express")
const router = express.Router()



router.get('/uyelik-bilgilerim', (req, res) => {
    
    res.render('account/uyelik-bilgilerim')
        
    
})



module.exports = router;