const express = require('express');
require('dotenv').config()
const bodyParser = require('body-parser');
const cors = require('cors');
const con= require('./dbConnection')
const jwt = require('jsonwebtoken')
const http = require("http");


const app = express();
app.use(cors());

function authenticateToken(req, res , next){
    const authHeader=req.headers['authorization'];
    const token=authHeader && authHeader.split(' ')[1]
    if(token==null)return res.sendStatus(401);
    jwt.verify(token, process.env.SECRET_KEY,(err,user)=>{
        if(err) return res.sendStatus(403);
        req.user=user;
        next();
    })
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

// Define a route
app.post('/signin',async (req, res) => {
    try{
        con.query(`SELECT * FROM user where user.email = "${req.body.email}"`, function (err, result) {
            if (err) throw err;
            else{
                if(req.body.password===result[0].password){
                    const user={
                        id:result[0].id,
                        user_name:result[0].user_name,
                        email:result[0].email,
                        type:result[0].type
                    }
                    const accessToken=jwt.sign(user,process.env.SECRET_KEY);
                    res.json({accessToken:accessToken,user:user})
                }
                else if(req.password !== result[0].password_hash){
                    res.status(401);
                    res.send('Access Denied');
                }
            }
        });
    }catch (e){
        console.log(e);
    }

});
app.post('/signup', async (req, res) => {
    try{
        const user={
            user_name:req.body.userName,
            phone_number:req.body.phoneNumber,
            email:req.body.email,
            password:req.body.password,
            type:req.body.type
        }
        con.query(`Insert into user Set ? `,user ,function (err, result) {
            if (err) throw err;
            else{
                res.send('User Created');
            }
        });
    }catch (e){
        console.log(e);
    }

});

app.get('/get-bank-account', authenticateToken, async (req, res) => {
    try{
        var query=`Select * from bank where bank.user_id = ${req.query.id}`
        con.query(query,function (err, result) {
            if (err) throw err;
            else{
                res.send(result);
            }
        });
    }catch (e){
        console.log(e);
    }
});

app.get('/get-items-count', authenticateToken, async (req, res) => {
    try{
        var query=`Select * from product `
        con.query(query,function (err, result) {
            if (err) throw err;
            else{
                res.send(result);
            }
        });
    }catch (e){
        console.log(e);
    }
});


app.post('/create-bank-account', authenticateToken, async (req, res) => {
    try{
        const min = 10000;
        const max = 100000;
        const info={
            ac_no:req.body.accountId,
            user_id:req.user.id,
            amount: Math.floor(Math.random() * (max - min + 1)) + min
        }
        con.query(`Insert into bank Set ? `,info ,function (err, result) {
            if (err) throw err;
            else{
                res.send('User Created');
            }
        });
    }catch (e){
        console.log(e);
    }
});

app.post('/save-stock', authenticateToken, async (req, res) => {
    try{
        req.body.items.forEach(pd=>{
            var info = {
                stock_count:pd.count
            }
            con.query(`Update product
                       set ?
                       where product.id = ${pd.id}`, info ,function (err, result) {
                if (err) throw err;
                else{

                }
            });
        })

    }catch (e){
        console.log(e);
    }finally {
        res.send('Update Successful');
    }
});
app.post('/purchase-product', authenticateToken, async (req, res) => {
        try {
            req.body.itemList.forEach((prod) => {
                var inf = {
                    stock_count: prod.count
                }
                try {
                    con.query(`Select *
                               from product
                               where product.id = ${prod.id}`, function (err, result) {
                        if (err) throw err;
                        else {
                            var inf2 = {
                                stock_count: result[0].stock_count - prod.count,
                            }
                            try {
                                con.query(`Update product
                                           set ?
                                           where product.id = ${prod.id}`, inf2, function (err, result) {
                                    if (err) throw err;
                                    else {

                                    }
                                });
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    });
                } catch (e) {
                    console.log(e);
                }
            })
            try {
                con.query(`Select *
                        from bank
                            where bank.user_id = ${req.user.id}`, function (err, result) {
                    if (err) throw err;
                    else {
                        var inf2 = {
                            amount: result[0].amount - req.body.total,
                        }
                        try {
                            con.query(`Update bank
                                                    set ?
                                                     where bank.user_id = ${req.user.id}`, inf2, function (err, result) {
                                if (err) throw err;
                                else {

                                }
                            });
                        } catch (e) {
                            console.log(e);
                        }
                    }
                });
            } catch (e) {
                console.log(e);
            }
            try {
                con.query(`Select * from user where  user.type = 2 `,function (err, result) {
                    if (err) throw err;
                    else{
                        var supplierId = result[0].id;
                        con.query(`Select *
                                   from bank
                                   where bank.user_id = ${supplierId}`, function (err, result) {
                            if (err) throw err;
                            else {
                                var inf2 = {
                                    amount: result[0].amount + req.body.total,
                                }
                                try {
                                    con.query(`Update bank
                                                    set ?
                                                     where bank.user_id = ${supplierId}`, inf2, function (err, result) {
                                        if (err) throw err;
                                        else {

                                        }
                                    });
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        });
                    }
                });
            } catch (e) {
                console.log(e);
            }
        }catch (e) {
            console.log(e);
        } finally {
            res.send('Item Purchased');
        }

});
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});