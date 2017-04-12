var express = require('express');
var router = express.Router();
var conn = require('../database/connection.js');


router.get('/getcode', function(req, res, next){
  var receiver = req.query.receiver;
  var product_id = req.query.product_id;
  var price = req.query.price;
  var product_name = req.query.product_name;
  var comments = req.query.comments;
  var website = req.query.website;
  console.log(typeof(price));
  if(receiver && product_id && price && product_name && comments && website){
    conn.query('SELECT * FROM partners WHERE ?',{email: receiver}, function(err, rows){
      if(err) throw err;
      if(rows.length > 0){
        conn.query('SELECT * FROM shops WHERE ?',{website: website}, function(errW, shops){
          if(errW) throw errW;
          if(shops.length > 0){
            var dataSend = {
              title: 'Scan code to pay',
              datatopay: {
                shop_id: shops[0].id,
                name: rows[0].name,
                receiver: receiver,
                product_id: product_id,
                product_name: product_name,
                price: price,
                comments: comments
              }
            };
            res.render('frontend/payment/getcode', dataSend);
          }
        });
      }
      else{
        res.render('frontend/payment/getcode', {title: 'Error', error: 'wrong email receiver'});
      }
    });
  }else
    res.render('frontend/payment/getcode',{title: 'Error'});
});


module.exports = router;
