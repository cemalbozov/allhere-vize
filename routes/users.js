const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Product = require("../models/product")
const Order = require("../models/order")
const { json } = require("body-parser")
const database = require('../database');


router.get('/register', (req, res) => {
    res.render('register')
})

// router.post('/register', (req, res) => {
//     email = req.body.email
//     User.findOne({ email }, function (err, user) {
//         if (user) {
//             console.log("e-mail kullanılmakta")
//             req.session.sessionFlash = {
//                 class: "alert alert-danger",
//                 message: "Bu e-posta kullanılmaktadır"
//             }
//             res.redirect("/users/register")
//         }
//         else {
//             User.create({
//                 firstname: req.body.name.toUpperCase(),
//                 lastname: req.body.lastname.toUpperCase(),
//                 email: req.body.email,
//                 password: req.body.password,
//                 phone: req.body.phone
//             }, (err, result) => {
//                 if (err) throw err;
//                 else {
//                     console.log(result);
//                     res.redirect("/")
//                 }

//             })
//         }
//     })



// })

router.post('/register', (req, res) => {
    email = req.body.email

    // Execute SQL query that'll select the account from the database based on the specified username and password
    database.query('SELECT * FROM user WHERE email = ?', [email], function (error, results, fields) {
        // If there is an issue with the query, output the error
        if (error) throw error;
        // If the account exists
        if (results.length > 0) {

            console.log("e-mail kullanılmakta")

            req.session.sessionFlash = {
                class: "alert alert-danger",
                message: "Bu e-posta kullanılmaktadır"
            }
            res.redirect("/users/register")

        } else {

            var sql = `INSERT INTO user (firstname, lastname, email, password, phone) VALUES ('${req.body.name.toUpperCase()}', '${req.body.lastname.toUpperCase()}', '${req.body.email}', '${req.body.password}', '${req.body.phone}')`;
            database.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                } else {

                    console.log(result);
                    var user_id = result.insertId
                    database.query('INSERT INTO shopcart (userId) VALUES (?); ',
                        [user_id], function (err, result) {
                            if (err) throw err;
                            database.query('INSERT INTO favorites (userId) VALUES (?); ',
                        [user_id], function (err, result) {
                            if (err) throw err;
                            

                        })

                        })
                    res.redirect("/")
                };
            });
        }

    });






})

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;


    database.query("SELECT * FROM user WHERE email = ?", [email], function (err, result) {
        if (err) throw err;
        if (result.length == 0) {
            req.session.sessionFlash = {
                class: "alert alert-danger",
                message: "Bu e-postaya ait kullanıcı bulunamadı. Lütfen kayıt olun !"
            }
            res.redirect("/users/register")
        }
        else if (result[0].password != password) {

            req.session.sessionFlash = {
                class: "alert alert-warning",
                message: "Hatalı Şifre girdiniz"
            }
            res.redirect("/users/login")
        }
        else {
            req.session.userId = result[0]._id
            console.log(req.session.userId)
            res.redirect("/")
        }
    })
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect("/")
    })
})

router.get('/shopcart', (req, res) => {
    if (req.session.userId) {
        //kullanıcının sepetindeki ürünIdleri alınıyor



        database.query(`
            Select p.*, b.brand, c.idCartItem From product p
            inner join brands b on b._id = p.brandid
            inner join cartitem c on c.ProductId = p._id
            inner join shopcart s on s.UserId = ? and c.ShopCartId = s._id`,
            [req.session.userId], function (err, result) {
                if (err) throw err;

                let shopcart = result
                console.log(result)
                //kullanıcının sepetinde ürün yoksa
                if (shopcart.length == 0) {
                    res.render("shopcart")
                }
                else {
                    database.query("SELECT * FROM adress WHERE UserId = ?", [req.session.userId], function (err, result) {
                        if (err) throw err;
                        console.log(result)
                        //alınan ürünIdlere göre ürünler alınıyor
                        res.render("shopcart", { products: shopcart, adresses: result })
                        //değişecek
                    })


                }
            })
    }
    else {
        res.redirect("/users/login")
    }

})

// router.get('/shopcart', (req, res) => {
//     if (req.session.userId) {
//         //kullanıcının sepetindeki ürünIdleri alınıyor
//         User.findById(req.session.userId).lean().then(user => {
//             let shopcart = user.shopcart
//             let products = []

//             //kullanıcının sepetinde ürün yoksa
//             if (shopcart.length == 0) {
//                 res.render("shopcart")
//             }
//             else {
//                 //alınan ürünIdlere göre ürünler alınıyor
//                 for (let i = 0; i < shopcart.length; i++) {
//                     Product.findById(shopcart[i]).lean().then(product => {
//                         products.push(product)
//                         if (products.length == shopcart.length) {

//                             res.render("shopcart", { products: products, adresses: user.adresses })
//                         }

//                     });
//                 }
//             }
//         });

//     }
//     else {
//         res.redirect("/users/login")
//     }

// })

router.post('/addshopcart/:site', (req, res) => {
    if (req.session.userId) {

        database.query('INSERT INTO cartitem (ShopCartId, ProductId) VALUES ((SELECT s._id FROM shopcart s where s.UserId = ?),"?"); ', [req.session.userId, parseInt(req.body.id)], function (err, result) {
            if (err) throw err;
            console.log(result);
        })
        if (req.params.site == "product") {
            res.redirect(`/product/${req.body.id}`)
        }
        else {
            res.redirect("/account/favorilerim")
        }
    }
    else {
        res.redirect("/users/login")
    }
})
// router.post('/addshopcart/:site', (req, res) => {
//     if (req.session.userId) {
//         User.findOneAndUpdate(
//             { _id: req.session.userId },
//             { $addToSet: { shopcart: req.body.id } }, { upsert: true },
//             function (error, success) {
//                 if (error) {
//                     console.log(error);
//                 }
//             });
//         if (req.params.site == "product") {
//             res.redirect(`/product/${req.body.id}`)
//         }
//         else {
//             res.redirect("/account/favorilerim")
//         }
//     }
//     else {
//         res.redirect("/users/login")
//     }
// })


router.delete("/shopcart/:id", (req, res) => {


    database.query('DELETE FROM cartitem where ShopCartId = (SELECT shopcart._id FROM shopcart where UserId = ?) AND idCartItem = ?', [req.session.userId, req.params.id], function (err, result) {
        if (err) throw err;

    })
    res.redirect("/users/shopcart")
})



// router.delete("/shopcart/:id", (req, res) => {

//     User.findOneAndUpdate(
//         { _id: req.session.userId },
//         { $pull: { shopcart: req.params.id } },
//         function (error, success) {
//             if (error) {
//                 console.log(error);
//             } else {
//                 console.log(req.params.id + " id li ürün silindi");
//             }
//         });
//     res.redirect("/users/shopcart")
// })

router.delete("/shopcart/delete/deleteall", (req, res) => {

    database.query('DELETE FROM cartitem where ShopCartId = (SELECT shopcart._id FROM shopcart where UserId = ?)', [req.session.userId], function (err, result) {
        if (err) throw err;

    })
    res.redirect("/users/shopcart")
})

// router.delete("/shopcart/delete/deleteall", (req, res) => {

//     User.findOneAndUpdate(
//         { _id: req.session.userId },
//         { $set: { shopcart: [] } },
//         function (error, success) {
//             if (error) {
//                 console.log(error);
//             } else {
//                 console.log("sepet boşaldı");
//             }
//         });
//     res.redirect("/users/shopcart")
// })

// router.post('/shopcart/order/create_order/:amount', (req, res) => {
//     if (req.session.userId) {

//         let products = []
//         //kullanıcının sepetindeki ürünIdleri alınıyor
//         User.findById(req.session.userId).lean().then(user => {

//             // cüzdan bakiyesi yeterliyse ;
//             if (req.params.amount <= user.wallet) {
//                 let new_wallet = user.wallet - req.params.amount;
//                 User.findByIdAndUpdate(req.session.userId, { wallet: new_wallet },
//                     function (err, docs) {
//                         if (err) {
//                             console.log(err)
//                         }
//                     });

//                 let shopcart = user.shopcart

//                 //alınan ürünIdlere göre ürünler alınıyor
//                 for (let i = 0; i < shopcart.length; i++) {
//                     Product.findById(shopcart[i]).lean().then(product => {
//                         products.push(product)
//                         if (i == shopcart.length - 1) {

//                             let order =
//                             {
//                                 products: products,
//                                 adress: req.body.adress,
//                                 amount: req.params.amount
//                             }

//                             Order.create({

//                                 user: user,
//                                 products: products,
//                                 adress: req.body.adress,
//                                 amount: req.params.amount

//                             }, (err, result) => {
//                                 if (err) throw err;
//                                 else {
//                                     console.log("sipariş oluşturuldu");
//                                     res.redirect("/")
//                                 }

//                             })

//                             User.findOneAndUpdate(
//                                 { _id: req.session.userId },
//                                 {
//                                     $set: { shopcart: [] },
//                                     $push: { orders: order }
//                                 },
//                                 function (error, success) {
//                                     if (error) {
//                                         console.log(error);
//                                     } else {
//                                         console.log("sepet boşaldı");
//                                     }
//                                 });


//                             // Oluşturulan siparişin Mail olarak gönderilmesi

//                             const mail_html = `<p>${user._id} Id li ${user.firstname} ${user.lastname} adlı kullanıcı yeni bir sipariş oluşturdu.</p>`


//                             "use strict";
//                             const nodemailer = require("nodemailer");

//                             // async..await is not allowed in global scope, must use a wrapper
//                             async function main() {
//                                 // Generate test SMTP service account from ethereal.email
//                                 // Only needed if you don't have a real mail account for testing
//                                 let testAccount = await nodemailer.createTestAccount();

//                                 // create reusable transporter object using the default SMTP transport
//                                 let transporter = nodemailer.createTransport({
//                                     host: "smtp.gmail.com",
//                                     port: 465,
//                                     secure: true, // true for 465, false for other ports
//                                     auth: {
//                                         user: "cemal.bozahmet.cb@gmail.com", // generated ethereal user
//                                         pass: "hvefyvkjajbvvwlr", // generated ethereal password
//                                     },
//                                 });

//                                 // send mail with defined transport object
//                                 let info = await transporter.sendMail({
//                                     from: '"allhere.com" <cemal.bozahmet.cb@gmail.com>', // sender address
//                                     to: "cemal.bozahmet.cb@gmail.com", // list of receivers
//                                     subject: "Yeni Sipariş", // Subject line
//                                     text: "Hello world?", // plain text body
//                                     html: mail_html, // html body
//                                 });

//                                 console.log("Message sent: %s", info.messageId);
//                                 // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

//                                 // Preview only available when sending through an Ethereal account
//                                 console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//                                 // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
//                             }

//                             main().catch(console.error);




//                         }
//                     });

//                 }
//             }

//             // bakiye yetersiz ise ;
//             else {
//                 req.session.sessionFlash = {
//                     class: "alert alert-warning",
//                     message: "Yetersiz bakiye !"
//                 }
//                 res.redirect("/account/wallet")
//             }
//         });
//     }

//     // giriş yapılmadı ise ;
//     else {
//         res.redirect("/users/login")
//     }

// })

router.post('/shopcart/order/create_order/:amount', (req, res) => {
    if (req.session.userId) {

        database.query("SELECT * FROM user WHERE _id = ?", [req.session.userId], function (err, user) {
            if (err) throw err;
            console.log(user[0].wallet)
            var user_detail = user;

            // cüzdan bakiyesi yeterliyse ;
            if (req.params.amount <= user[0].wallet) {
                let new_wallet = user[0].wallet - req.params.amount;

                database.query("UPDATE user SET wallet = ? WHERE _id = ?", [new_wallet, req.session.userId], function (err) {
                    if (err) throw err;
                })

                database.query(
                    `Select p._id From product p
                    inner join cartitem c on c.ProductId = p._id
                    inner join shopcart s on s.UserId = ?`,
                    [req.session.userId], function (err, result) {
                        if (err) throw err;

                        let shopcart = result
                        console.log(parseInt(req.body.adress))
                        database.query("INSERT INTO allheredb.order (UserId, AdressId, amount) VALUES (?, ?, ?);", [req.session.userId, parseInt(req.body.adress), parseFloat(req.params.amount)], function (err, result) {
                            if (err) throw err;

                            let orderId = result.insertId;
                            console.log(orderId)

                            var values = [];

                            shopcart.forEach(cartitem => {
                                values.push([orderId, cartitem._id])
                            });
                            console.log(values);

                            database.query("INSERT INTO allheredb.orderitem (OrderId, ProductId) VALUES ? ", [values], function (err) {
                                if (err) throw err;


                                console.log("sipariş oluşturuldu");
                                res.redirect("/")

                                database.query('DELETE FROM cartitem where ShopCartId = (SELECT shopcart._id FROM shopcart where UserId = ?)', [req.session.userId], function (err) {
                                    if (err) throw err;

                                    console.log("sepet boşaltıldı");

                                    // Oluşturulan siparişin Mail olarak gönderilmesi

                                    const mail_html = `<p>${user_detail[0]._id} Id li ${user_detail[0].firstname} ${user_detail[0].lastname} adlı kullanıcı yeni bir sipariş oluşturdu.</p>`


                                    "use strict";
                                    const nodemailer = require("nodemailer");

                                    // async..await is not allowed in global scope, must use a wrapper
                                    async function main() {
                                        // Generate test SMTP service account from ethereal.email
                                        // Only needed if you don't have a real mail account for testing
                                        let testAccount = await nodemailer.createTestAccount();

                                        // create reusable transporter object using the default SMTP transport
                                        let transporter = nodemailer.createTransport({
                                            host: "smtp.gmail.com",
                                            port: 465,
                                            secure: true, // true for 465, false for other ports
                                            auth: {
                                                user: "cemal.bozahmet.cb@gmail.com", // generated ethereal user
                                                pass: "hvefyvkjajbvvwlr", // generated ethereal password
                                            },
                                        });

                                        // send mail with defined transport object
                                        let info = await transporter.sendMail({
                                            from: '"allhere.com" <cemal.bozahmet.cb@gmail.com>', // sender address
                                            to: "cemal.bozahmet.cb@gmail.com", // list of receivers
                                            subject: "Yeni Sipariş", // Subject line
                                            text: "Hello world?", // plain text body
                                            html: mail_html, // html body
                                        });

                                        console.log("Message sent: %s", info.messageId);
                                        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

                                        // Preview only available when sending through an Ethereal account
                                        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
                                        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                                    }
                                    main().catch(console.error);
                                })
                            })
                        })
                    })
            }
            else {
                req.session.sessionFlash = {
                    class: "alert alert-warning",
                    message: "Yetersiz bakiye !"
                }
                res.redirect("/account/wallet")
            }
        })
    }

    // giriş yapılmadı ise ;
    else {
        res.redirect("/users/login")
    }

})

module.exports = router;