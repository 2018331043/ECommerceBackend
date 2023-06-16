var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'ecommerce_app',
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query(`SELECT * FROM user `, function (err, result) {
        if (err) throw err;
        else console.log(result)
    });
});

module.exports= con;
