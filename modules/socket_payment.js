var jwt = require('jwt-simple');
var keys = require('../configs/keys.js');
var datetime = require('node-datetime');
var twilio = require('twilio');
var conn = require('../database/connection.js');
var Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: 'a1d4e71d',
  apiSecret: '4f24837677f8c890'
});

var client = twilio(keys.TWILIO_ACCOUNT_SID, keys.TWILIO_AUTH_TOKEN);
var users = [];
exports = module.exports = function(io){
  io.on('connection', function(socket){
    console.log('Client connected. '+socket.id);

    socket.on('userInfo', function(data){
      var web = data.protocol+'//'+data.hostname;
      console.log(web);
      conn.query('SELECT * FROM shops WHERE ?',{website: web}, function(err, rows){
        if(err) throw err;
        if(rows.length > 0){

          users[socket.id] = {
            id: socket.id,
            shop_id: rows[0].id
          }
          console.log(users[socket.id].id);
          var socketid = users[socket.id].id;
          io.sockets.connected[socketid].emit('socketid', socketid);
        }
      });
    });

    socket.on('notification', function(socketid){
      var shop_id = users[socketid].shop_id;
      conn.query('SELECT * FROM list_notification WHERE ? ORDER BY id DESC',{shop_id: shop_id}, function(err, shops){
        if(err) throw err;
        if(shops.length > 0){
          var list = [];
          var uncheck = 0;
          for(var i = 0; i < shops.length; i++){
            if(shops[i].checked == 0){
              uncheck++;
            }
            var created = datetime.create(shops[0].created_at).format('d/m/Y H:I');
            list.push({
              id: shops[i].id,
              shop_id: shops[i].shop_id,
              member_id: shops[i].member_id,
              message: shops[i].message,
              status: shops[i].status,
              created_at: created
            });
          }
          console.log(uncheck);
          io.sockets.connected[socketid].emit('notifData', list, uncheck);
        }
      });
    });

    socket.on('checkedNotification', function(data){
      conn.query('UPDATE list_notification SET ?',{checked: 1}, function(err){

      });
    });
    socket.on('payment', function(data){
      console.log(data);
    });

    socket.on('clientPayment', function(data){
      var access_token = data.access_token;
      var product_info = data.product_info;
      var data_user = jwt.decode(access_token, keys.KEY_ACCESS_TOKEN);
      conn.query('SELECT * FROM members WHERE ?', {phone: data_user.phone}, function(err, rows){
        if(err) throw err;
        var phonenum = rows[0].phone;
        if(phonenum.indexOf('0') == 0){
          phonenum = phonenum.replace('0', '+84');
        }
        if(rows.length > 0){
          console.log(rows[0].money);
          console.log('price: '+product_info.price);
          if(rows[0].money >= parseInt(product_info.price)){
            var money = rows[0].money - product_info.price;
            conn.query('UPDATE members SET money = ? WHERE id = ?', [money, rows[0].id]);
            //

            // nexmo.message.sendSms(
            //   '84975117407', '84986616031', 'Đã thanh toán thành công', {type: 'unicode'},
            //     (err, responseData) => {
            //       if (err) {
            //         console.log(err);
            //       } else {
            //         console.dir(responseData);
            //       }
            //     }
            //  );
            //
            console.log('===ACCEPTED====');
            var notifData = {
              shop_id: product_info.shop_id,
              member_id: rows[0].id,
              message: 'Khách hàng '+rows[0].fullname+' đã mua sản phẩm mã '+product_info.product_id+' với giá '+product_info.price+'đ',
              status: 1,
            };
            console.log(notifData);
            conn.query('INSERT INTO list_notification SET ?', notifData, function(errX){
              if(errX) throw errX;
              console.log('========ZZZ========');
              for(var key in users){
                if(users[key].shop_id == product_info.shop_id){
                  console.log(product_info.shop_id);
                  console.log(users[key]);
                  io.sockets.connected[users[key].id].emit('appendData', notifData);
                  break;
                }
              }
            });

          }
          else{
            // nexmo.message.sendSms(
            //   '84975117407', '84986616031', 'Thanh toán thất bại, tài khoản hết tiền', {type: 'unicode'},
            //     (err, responseData) => {
            //       if (err) {
            //         console.log(err);
            //       } else {
            //         console.dir(responseData);
            //       }
            //     }
            //  );

            console.log('===PAY FAIL====');
            var notifData = {
              shop_id: product_info.shop_id,
              member_id: rows[0].id,
              message: 'Khách hàng '+rows[0].fullname+' đã mua sản phẩm mã '+product_info.product_name+' với giá '+product_info.price+'đ',
              status: 0,
            };
            conn.query('INSERT INTO list_notification SET ?', notifData, function(errX){
              if(errX) throw errX;
            });
          }
          //Do when fail
        }
      });
    });
    socket.on('disconnect', function(){
      console.log('Client'+socket.id+' disconnected');
      delete users[socket.id];
      console.log(users);
    });
  });
}
