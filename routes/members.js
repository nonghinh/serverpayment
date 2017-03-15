var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var jwt = require('jwt-simple');
var passwordHash = require('password-hash');
var keys = require('../configs/keys.js');

var conn = require('../database/connection.js');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/register', function(req, res, next) {
  res.render('frontend/member/register', {title: 'Register'});
});

router.post('/loginApp', function(req, res, next) {
  var phone = req.body.phone !== 'undefined' ? req.body.phone : 000;
  var password = req.body.password !== 'undefined' ? req.body.password : '';
  conn.query("SELECT * FROM members WHERE ?", {phone: req.body.phone}, function(err, rows){
    if(err) throw err;
    if(rows.length > 0){
      if(passwordHash.verify(password, rows[0].password)){
        var access_token = rows[0].access_token;
        console.log(access_token);
        res.send(access_token);
      }
      else{
        res.send('wrong');
      }
    }
    else{
      res.send('wrong');
    }
  });
});


module.exports = router;
