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
router.post('/register', function(req, res, next) {
  var fullname = req.body.fullname;
  var email = req.body.email;
  var phone = req.body.phonenumber;
  var password = req.body.password;
  var repassword = req.body.confirm_password;
  var error='';
  if(password == repassword){
    var data = {
      fullname: fullname,
      email: email,
      phone: phone,
      password: passwordHash.generate(password),
      access_token: jwt.encode({phone: phone, password: password}, keys.KEY_ACCESS_TOKEN)
    }
    console.log('KEY_ACCESS_TOKEN: '+ keys.KEY_ACCESS_TOKEN);
    conn.query('INSERT INTO members SET ?',data, function(err, result){
      if(err) throw err;
      console.log('Added a new supporter');
      res.redirect('/members/login');
    });
  }
  else{
    res.redirect('/members/register?error=1');
  }
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

router.get('/login', function(req, res, next){
  if(req.session.memberAccount){
    req.session.destroy();
  }
  if(!req.session.memberAccount){
    if(req.query.error){
      res.render('frontend/login', {title: 'Login', error: req.query.error});
    }
    else
      res.render('frontend/login', {title: 'Login'});
  }
  else{
    res.redirect('/');
  }
});
router.post('/login', function(req, res, next){
  var email = req.body.email;
  var password= req.body.password;
  if(email && password){
    conn.query('SELECT * FROM members WHERE ?', {email: email}, function(err, rows){
      if(err) throw err;
      if(rows.length > 0){
        if(passwordHash.verify(password, rows[0].password)){
          req.session.memberAccount = email;
          req.session.memberId = rows[0].id;
          res.redirect('/members/dashboard');
        }
        else{
          res.redirect('/members/login?error=w');
        }
      }
      else{
        res.redirect('/members/login?error=w');
      }
    });
  }
  else{
    res.redirect('/members/login?error=v');
  }
});

router.get('/dashboard', authChecker, function(req, res, next){
  conn.query('SELECT * FROM members WHERE ?', {id: req.session.memberId}, function(err, rows){
    if(err) throw err;
    var money = 0;
    if(rows.length > 0){
      money = rows[0].money;
    }
    res.render('frontend/member/dashboard',{title: 'Dashborad', money: money});
  })

});

router.get('/logout', function(req, res, next){
  req.session.destroy(function(err){
    if(err) throw err;
  });
  res.redirect('/');
});



function authChecker(req, res, next){
  if (req.session.memberAccount) {
        next();
    } else {
       res.redirect("/members/login");
    }
}
module.exports = router;
