var express = require('express');
var app = express();
var router = express.Router();
var conn = require('../database/connection.js');
var data = [];
router.get('/:id/default', function(req, res, next){
  var id = req.params.id;
  conn.query('SELECT * FROM shops WHERE ?', {id: id}, function(err, rows){
    if(err) throw err;
    if(rows.length > 0){
      res.sendFile(__dirname+'/pub/plugin.js');
    }
  });
  console.log(data);
});

router.get('/addon', function(req, res, next){
    res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
    res.render('addon/notification');
});
module.exports = router;
