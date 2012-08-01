/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes');

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
// Configuration
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('view options', {
        layout: false
    });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
var conns = {};
var userNames = {};
var sids = {};
var onLineList = [];
io.sockets.on('connection', function(socket) {
    var sid = socket.id;
    conns[sid] = socket;
    socket.on('submitUserName', function(userName, fn) {
        if (userNames[userName]) {
            fn("have");
        } else {
            for (var i = onLineList.length - 1; i >= 0; i--) {
                var tmpSid = userNames[onLineList[i]]["sid"];
                conns[tmpSid].emit('addNewUserToList', userName);
            }
            var userInfo = {};
            userInfo["sid"] = sid;
            userNames[userName] = userInfo;
            sids[sid] = userName;
            onLineList.push(userName);
            fn("not_have");

        }
    });

    socket.on('getOnlineList', function(userName, fn) {
        fn(onLineList);
    });
    socket.on('setCompetitor', function(competitor, fn) {
        var myName = sids[socket.id];
        for (var i = onLineList.length - 1; i >= 0; i--) {
            if (onLineList[i] == myName) {
                onLineList.splice(i, 1);
            }
        }
        for (var i = onLineList.length - 1; i >= 0; i--) {
            if (onLineList[i] == competitor) {
                onLineList.splice(i, 1);
            }
        }
        var deletedUser = [myName, competitor];
        for (var i = onLineList.length - 1; i >= 0; i--) {
            var tmpSid = userNames[onLineList[i]]["sid"];
            conns[tmpSid].emit('deleteUserFromList', deletedUser);
        }
        if (!userNames[myName]["competitor"] && !userNames[competitor]["competitor"]) {
            userNames[myName]["competitor"] = competitor;
            userNames[competitor]["competitor"] = myName;
            var comSid = userNames[competitor]["sid"];
            conns[comSid].emit('beginChess', 'begin');
            fn("success");
            socket.on('goChess', function(data) {
                conns[comSid].emit('comGoChess', data);
            });
            conns[comSid].on('goChess', function(data) {
                socket.emit('comGoChess', data);
            });
        } else {
            fn("fail");
        }
    });
});
app.listen(3000, function() {
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});