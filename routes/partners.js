var express = require('express');
var app = express();
var router = express.Router();
var mysql = require('mysql');
var jwt = require('jwt-simple');
var passwordHash = require('password-hash');
var keys = require('../configs/keys.js');
var session = require('express-session');

var conn = require('../database/connection.js');

app.use(session({
  secret: keys.KEY_SESSION,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false}}));
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/register', function(req, res, next) {
  if(typeof(req.query.error) !== 'undefined'){
    res.render('frontend/partner/register', {title: 'Register', error: req.query.error});
  }
  else{
    res.render('frontend/partner/register', {title: 'Register'});
  }
});
router.post('/register', function(req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;
  var password = req.body.password;
  var repassword = req.body.repassword;

  if(name && email && phone && password){
    conn.query('SELECT * FROM partners WHERE ?', {email: email}, function(err, qEmail){
      if(err) throw err;
      if(qEmail.length == 0){
        conn.query('SELECT * FROM partners WHERE ?', {phone: phone}, function(err2, qPhone){
          if(err2) throw err2;
          if(qPhone.length == 0){
            if(password == repassword){
              var data = {
                name: name,
                email: email,
                phone: phone,
                password: passwordHash.generate(password)
              };
              conn.query('INSERT INTO partners SET ?',data, function(err, respond){
                if(err) throw err;
                res.redirect('/partners/login');
              });
            }
            else{
              res.redirect('/partners/register?error=ph');
            }
          }
          else{
            res.redirect('/partners/register?error=p');
          }
        });
      }
      else{
        res.redirect('/partners/register?error=e');
      }
    });
  }
  else{
    res.redirect('/partners/register?error=v');
  }
});

router.get('/login', function(req, res, next){
  if(req.session.partnerAccount){
    req.session.destroy();
  }

  if(!req.session.partnerAccount){
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
    conn.query('SELECT * FROM partners WHERE ?', {email: email}, function(err, rows){
      if(err) throw err;
      if(rows.length > 0){
        if(passwordHash.verify(password, rows[0].password)){
          req.session.partnerAccount = email;
          req.session.partnerId = rows[0].id;
          console.log(req.session.partnerAccount);
          res.redirect('/partners/dashboard');
        }
        else{
          res.redirect('/partners/login?error=w');
        }
      }
      else{
        res.redirect('/partners/login?error=w');
      }
    });
  }
  else{
    res.redirect('/partners/login?error=v');
  }
});

router.get('/dashboard', authChecker, function(req, res, next){
  var partner_id = req.session.partnerId;
  conn.query('SELECT * FROM shops WHERE partner_id = ?', [partner_id], function(err, rows){
    if(err) throw err;
    if(rows.length > 0){
      res.render('frontend/partner/dashboard', {title: 'Dashboard', apps: rows});
    }
    else{
      res.render('frontend/partner/dashboard', {title: 'Dashboard', apps: null});
    }
  });
});

router.get('/createApp', authChecker, function(req, res, next){
  res.render('frontend/partner/createapp', {title: 'Create App'});
});
router.post('/createApp', function(req, res, next){
  var name = req.body.name;
  var website = req.body.website;
  var address = req.body.address;
  var item = req.body.item;
  var desc = req.body.description;
  var idp = req.session.partnerId;
  console.log(idp);
  if(name && website && address && item && desc){
    conn.query('INSERT INTO shops SET ?', {name: name, partner_id: idp, website: website, address: address, business_item: item, description: desc}, function(err, data){
      if(err) throw err;
      res.redirect('/partners/dashboard');
    });
  }else{
    res.render('frontend/partner/createapp',{title: 'Create App', error: 'validate'});
  }
});

router.get('/app/:id/view',authChecker, function(req, res, next){
  var id = req.params.id;
  conn.query('SELECT * FROM shops WHERE ?',{id: id}, function(err, rows){
    if(err) throw err;
    if(rows.length > 0){
      conn.query('SELECT * FROM list_notification WHERE ?',{shop_id: rows[0].id}, function(errN, msgs){
        if(errN) throw errN;
        res.render('frontend/partner/view',{title: 'Thông tin website đã tạo', app: rows[0], msgs: msgs});
      });
    }else{
      res,redirect('/');
    }
  });
});

router.get('/deleteAllMsg/:id', authChecker, function(req, res, next){
  var shop_id = req.params.id;
  conn.query('DELETE FROM list_notification WHERE ?', {shop_id: shop_id}, function(err, rows){
    if (err) throw err;
    res.redirect('back');
  });
});
router.get('/deleteMsg/:shop/:id',authChecker, function(req, res, next){
  var shop_id = req.params.shop;
  var msg_id = req.params.id;
  conn.query('DELETE FROM list_notification WHERE id = ? AND shop_id = ?', [ msg_id, shop_id], function(err, rows){
    if (err) throw err;
    res.redirect('back');
  });
});

router.get('/logout', function(req, res, next){
  req.session.destroy(function(err){
    if(err) throw err;
  });
  res.redirect('/');
});

router.get('deleteApp/:id', function(req, res, next){
  conn.query('DELETE FROM shops WHERE ?', {id: req.params.id}, function(err){
    if(err) throw err;
    res.redirect('back');
  });
});

//Kiem tra session
function authChecker(req, res, next){
  if (req.session.partnerAccount) {
        next();
    } else {
       res.redirect("/partners/login");
    }
}
module.exports = router;
