var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var auth = null;
  if(req.session.memberAccount){
    auth = 'member';
  }
  if(req.session.partnerAccount){
    auth = 'partner';
  }
  res.render('frontend/index', { title: 'Express', auth: auth });
});

router.get('/guideIntegrate', function(req, res, next){
  var auth = null;
  if(req.session.memberAccount){
    auth = 'member';
  }
  if(req.session.partnerAccount){
    auth = 'partner';
  }
  res.render('frontend/guide_intergrate', {title: 'Hướng dẫn tích hợp thanh toán', auth: auth})
});
module.exports = router;
