var app  = require('http').createServer(handler);
var io   = require('socket.io').listen(app);
var fs   = require('fs');
var util = require('util');
var spawn  = require('child_process').spawn;
var vmstat = spawn('vmstat', ['1', '-n']);
var port = 8001;
var vmstat_last;


io.configure('development', function () {
  io.set('log level', 1);
  io.set('transports', ['websocket']);
});

app.listen(port);
function handler(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var rs = fs.createReadStream(__dirname + '/index.html');
  util.pump(rs, res);
}

io.sockets.on('connection', function(client) {
  setInterval(function() {
    client.emit('vmstat', vmstat_last);
  }, 1000);
});

vmstat.stdout.on('data', function (data) {
  var str = data.toString();
  if(!str.match(/\d+/)) return;
  str = str.replace(/\n/g, '')
  str = str.replace(/\s*(\S+)\s+/g, '$1 ')
  ary = str.split(' ');
  vmstat_last = {
    procs: { r: Number(ary[0]), b: Number(ary[1]) },
    memory: { swpd:  Number(ary[2]) / 1024.0, free:  Number(ary[3]) / 1024.0, buff:  Number(ary[4]) / 1024.0, cache: Number(ary[5]) / 1024.0 },
    swap: { si: Number(ary[6]), so: Number(ary[7]) },
    io: { bi: Number(ary[8]), bo: Number(ary[9]) },
    system: { in: Number(ary[10]), cs: Number(ary[11]) },
    cpu: { us: Number(ary[12]), sy: Number(ary[13]), id: Number(ary[14]), wa: Number(ary[15]) }
  };
});
