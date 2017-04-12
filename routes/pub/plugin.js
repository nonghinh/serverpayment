var socket = io.connect('https://limitless-ridge-56856.herokuapp.com');

getAddon();
var hostname = window.location.hostname;
var protocol = window.location.protocol;
var socketid = [];

socket.emit('userInfo', {hostname: hostname, protocol: protocol});
socket.on('socketid', function(id){
  if(typeof(Storage) !== 'undefined'){
    sessionStorage.setItem('socketid', id);
    socketid.push(id);
    console.log(sessionStorage.socketid);
    socket.emit('notification', id);
  }
});

socket.on('notifData', function(msg, count){
  document.getElementById('notifNumber').innerHTML = count;
  if(count == 0){
    document.getElementById('notifNumber').style.display = 'none';
  }

  var listMsg = document.getElementById('nc-list-msg');
  for(var i = 0; i < msg.length; i++){
    var itemMsg = document.createElement('li');
      itemMsg.setAttribute('class','nc-msg-item');
    var textNode = document.createTextNode(msg[i].message);
    itemMsg.appendChild(textNode);
    if(i > 0){
      var item0 = listMsg.firstChild;
      listMsg.insertBefore(itemMsg, item0);
    }
    else{
      listMsg.appendChild(itemMsg);
    }
  }
});

socket.on('appendData', function(msg){
  console.log('=====CCCCCC');
  var count = document.getElementById('notifNumber').innerHTML;
  count = parseInt(count);
  if(document.getElementById('notifNumber').style.display = 'none'){
    document.getElementById('notifNumber').style.display = 'block';
  }
  count = parseInt(count) + 1;
  document.getElementById('notifNumber').innerHTML = count;

  //Them tin
  var listMsg = document.getElementById('nc-list-msg');
  var itemMsg = document.createElement('li');
    itemMsg.setAttribute('class','nc-msg-item');
  var textNode = document.createTextNode(msg.message);
  itemMsg.appendChild(textNode);
  if(listMsg.innerHTML !== ""){
    var item0 = listMsg.firstChild;
    listMsg.insertBefore(itemMsg, item0);
  }
  else{
    listMsg.appendChild(itemMsg);
  }
});


var ncBox = document.getElementById('notifBoxNC');
ncBox.addEventListener('click', function(e){
  var ncBoxMsg = document.getElementById('nc-box-msg');
  if(ncBoxMsg.style.display == 'block'){
    ncBoxMsg.style.display = 'none';
  }else{
    ncBoxMsg.style.display = 'block';
  }
  document.getElementById('notifNumber').style.display = 'none';
  document.getElementById('notifNumber').innerHTML = 0;
  socket.emit('checkedNotification', true);
});


function getAddon(){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if(this.readyState == 4){
      if(this.status == 200){
        var notif = document.getElementById('notifBoxNC');
        var notifBox = this.responseText;
        notif.innerHTML = notifBox;
        console.log(typeof(this.responseText));
      }
      else {
        alert(this.status);
      }
    }
  }
  xhr.open("GET", "http://localhost:3000/plugin/addon", true);
  xhr.send();

}
