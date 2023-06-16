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
            password:req.body.password
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
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});