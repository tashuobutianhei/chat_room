var fs = require('fs');
var http = require('http');
var socketIo=require("socket.io");
var express = require('express');
var path = require('path')
var cookoeParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var mysql=require('mysql');
var multipart = require('connect-multiparty');

var server = express();
//静态文件托管
server.use(express.static('public'));



var servers=http.createServer(server);
var io=socketIo(servers);//将socket.io注入express模块


io.on('connection',function (Socket) {
    Socket.on("join",function (data,fn) {
        Socket.join(data.roomName); // join(房间名)加入房间
       // fn({"code":0,"msg":"加入房间成功","roomName":data.roomName});
    });
    Socket.on("leave",function (data,fn) {
        Socket.leave(data.roomName);//leave(房间名) 离开房间
       // fn({"code":0,"msg":"已退出房间","roomName":data.roomName});
    });
    Socket.on("sendMsg",function (data,fn) {
        Socket.broadcast.to(data.roomName).emit("receiveMsg",data);
        //fn({"code":0,"msg":"消息发生成功"});
    });
    Socket.on("private",function (data,fn) {

        var sql ='select id from admin_table where username = ? ';
        db.query(sql,data.friend, function (err, data1){
            if(err){

            }else{
                var string=JSON.stringify(data1);
                var result = JSON.parse(string);

                data.friendid = result[0].id
                db.query(sql,data.client, function (err, data2){
                    if(err){
                        //console.log(data)
                    }else{

                        string=JSON.stringify(data2);
                        result = JSON.parse(string);
                        data.userid =  result[0].id;
                        //console.log(data)
                        io.sockets.emit("privateMsg",data);
                    }
                })
            }
        })

    })
})


var multipartMiddleware = multipart();
server.use(multipart({uploadDir:__dirname+'/public/upfile' }));//设置上传文件存放的地址


server.use(bodyParser.urlencoded({ extended: false }));

server.use(cookoeParser());//得先设置cookie
server.use(cookieSession({ //session中间件
    name:'see', //session的名字
    maxAge: 2*3600*1000,
    keys:['aaa','bbb','ccc']//秘钥，循环使用  必选
}));

var db=mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1997123',
    database: 'node_test'
});

db.connect(function(err){
    if(err){

    }else{
        console.log('连接成功：')
    }
})

server.get('/room',function (req,res) {
    if(req.query.join){
        console.log(req.query.join)
        if(/^p123/.test(req.query.join)){
            sql = 'insert into room(roomname,roomnum) values(?,?);';
            db.query(sql,[req.query.join,2],function (err,data) {
                if(err) console.log(err)
            })
        }


        var sql = 'select roomid,roomnum from room where roomname = ? ;';
        db.query(sql,req.query.join,function (err,data) {
            if(err){
                console.log(err)
            }else{
                string=JSON.stringify(data);
                result = JSON.parse(string);

                if(result.length==0){
                    res.send(JSON.stringify({
                        res:'no',
                    }))
                }else{
                    var num = result[0].roomnum;
                    var sql = 'update room set roomnum = roomnum+1 where roomname = ?;'
                    db.query(sql,req.query.join,function (err,data) {
                        if(err){
                                console.log(err)
                        }else {
                            res.send(JSON.stringify({
                                res:'ok',
                                num:num+1
                            }))
                        }
                    })
                }
            }
        })
    }else if(req.query.leave){
        var sql = 'update room set roomnum = roomnum-1 where roomname = ?;'
        db.query(sql,req.query.leave,function (err,data) {
            if(err){
                console.log(err)
            }else{
                sql = 'select roomnum from room where roomname = ? ;';
                db.query(sql,req.query.leave,function (err,data) {
                    string=JSON.stringify(data);
                    result = JSON.parse(string);
                    console.log(result)
                    if(result[0].roomnum==0){
                        sql = 'delete from room where roomname = ? ;';
                        db.query(sql,req.query.leave,function (err,data) {
                            if(err){
                                console.log(err);
                            }else{
                                res.send(JSON.stringify({
                                    res:'noroom',
                                }));
                            }
                        })
                    }else{
                        res.send(JSON.stringify({
                            res:'haveroom',
                        }))
                    }
                })
            }
        })
    }
})

server.get('/create',function (req,res) {
    var sql = 'select roomid from room where roomname= ?';
    db.query(sql,req.query.room,function (err,data) {
        if(err){
            console.log(err)
        }else {
            string=JSON.stringify(data);
            result = JSON.parse(string);
                if(result.length==0){
                    var sql ='INSERT INTO room (roomname,roomnum) VALUES (?,?)';
                    db.query(sql,[req.query.room,1],function (err,data) {
                        if(err){
                            console.log(err)
                        }else {
                            res.send(JSON.stringify({
                                res:'ok',
                                roomname:req.query.room
                            }))

                        }
                    })
            }else{
                    res.send(JSON.stringify({
                        res:'no'
                    }))
            }

        }
    })
})
//注册
server.post('/upfile',multipartMiddleware,function (req,res) {
    if(req.body.username==''||req.body.password==''){
        var data = {
            err: '不允许空信息'
        };
        res.send(JSON.stringify(data))
    }else{
        var sql ='select * from admin_table where username="' + req.body.username+'";';
        db.query(sql,function (err,data) {
            if(err){
                console.log(err)
            }
            if(data){

                if(data.length==0){
                    var url = path.parse(req.files.file.path).base;
                    var sql = 'insert  into admin_table(username,pasword,head) values (?,?,?)';
                    db.query(sql,[req.body.username,req.body.password,url], function (err, data) {
                        if (err) {
                            console.log(err)
                        } else {
                            if(data.length!=0){
                                var data = {
                                    ok: '注册成功'
                                };
                                res.send(JSON.stringify(data))
                            }else{
                                var data = {
                                    err: '用户名密码错误'
                                }
                                res.send(JSON.stringify(data))
                            }

                        }
                    })
                }else{
                    var data = {
                        err: '账号已存在'
                    };
                    res.send(JSON.stringify(data))

                }
            }
        })
    }

})

//登录   http://localhost:8081/login/updata/?want=register&aa=123456
server.get('/login/updata',function (req,res) {
    if(req.query.want=='login') {
        var sql = 'select * from admin_table where username= ? and pasword = ?';
        db.query(sql,[req.query.user,req.query.password] ,function (err, data) {
            if (err) {

            } else {
                if(data.length!=0){
                    req.session['userId']=data[0].id;
                    var data2 = {
                        ok: '登录成功'
                    };
                    res.send(JSON.stringify(data2));

                }else{
                    var data = {
                        err: '用户名密码错误'
                    }
                    res.send(JSON.stringify(data))
                }

            }
        })
    }

})

//信息
server.get('/look',function (req,res) {
    var sql = 'select head,username,bg,describes from admin_table where id=?';
    db.query(sql,req.session['userId'],function(err,data){
        if(err){
            res.send('数据库错误').end();
        }else{
           // console.log(1)

            var string=JSON.stringify(data);
            var result = JSON.parse(string);
            result[0].head = 'http://localhost:8081/upfile/' + result[0].head;
            result[0].bg = 'http://localhost:8081/upfile/' + result[0].bg;


            sql = 'select userid,friendid,status from friend where userid = ?'
            db.query(sql,req.session['userId'],function(err,data){
                if(err){

                }else{
                    var string=JSON.stringify(data);
                    data2 = JSON.parse(string);

                    var friend = [];

                    if(data2.length==0){
                        result[0].friend = friend;
                        res.send(JSON.stringify(result[0]))
                    }else{
                        console.log(666)
                        data2.forEach(function (item,index,arr) {
                            sql = 'select head,username from admin_table where id=?';
                            db.query(sql,item.friendid,function(err,datas){
                                if(err){
                                    console.log(4)
                                }else{
                                    sql = 'select roomname,roomnum from room ';
                                    db.query(sql,function(err,data){
                                        if(err){
                                            console.log(5)
                                        }else {
                                            strings=JSON.stringify(data);
                                            data4 = JSON.parse(strings);


                                            string=JSON.stringify(datas);
                                            data3 = JSON.parse(string);
                                            data3[0].head = 'http://localhost:8081/upfile/' + data3[0].head;
                                            data3[0].status = item.status;

                                            friend.push(data3[0]);
                                            result[0].friend = friend;
                                            result[0].list = data4

                                            if(index == arr.length-1){
                                                res.send(JSON.stringify(result[0]))
                                            }
                                        }

                                    })

                                }

                            })

                        })
                    }

                }

            })


        }
    })

})

//退出登陆
server.get('/out',function (req,res) {
    delete req.session['userId'];
    res.send(JSON.stringify({res:'ok'}))

})

//更换背景
server.post('/upbg',multipartMiddleware,function (req,res) {
    //console.log(req.body)
    var url = path.parse(req.files.file.path).base;
    var sql = 'update   admin_table set bg = ? where id = ?';
    db.query(sql,[url,req.session['userId']], function (err, data) {
        if (err) {
            console.log(err)
        } else {
            if(data.length!=0){
                 var src = 'http://localhost:8081/upfile/' + url;
                 var data = {
                     ok: '更换成功',
                     src:src
                 };
                res.send(JSON.stringify(data));
            }else{
                var data = {
                    err: '错误'
                }
                res.send(JSON.stringify(data))
            }

        }
    })
})

//req.session['userId']
//-1,,拉黑，0。发送待审核，1.正常 -2.收到待审核
server.get('/findFriend',function (req,res) {
    var sql = 'select id from admin_table where username=?';
    db.query(sql,req.query.username,function(err,data){
        if(err){
            res.send('数据库错误').end();
        }else{
            if(data.length==0){
                res.send(JSON.stringify({
                    err:'查无此人'
                }))
            }else{
                console.log(data)
                var string=JSON.stringify(data);
                var result = JSON.parse(string);

                var friendid = result[0].id;

                var sql = 'select status from friend where userid=? and friendid = ?';
                db.query(sql,[req.session['userId'],friendid],function(err,data){
                    if(err){
                        res.send('数据库错误').end();
                    }else{
                        console.log(data)
                        if(data.length==0){
                            //没发送过
                            var sql1 = 'insert into friend(userid,friendid,status) values(?,?,?)';
                            db.query(sql1,[req.session['userId'],friendid,0],function (err,data) {
                                    if(err){
                                        console.log(err)
                                    }else{
                                        db.query(sql1,[friendid,req.session['userId'],-2],function (err,data) {
                                                if(err){
                                                    console.log(err)
                                                }else{
                                                    res.send(JSON.stringify({
                                                        res:'请求发送成功，请等待回复'
                                                    }))
                                                }
                                            })
                                        }
                            })
                        }else{
                            //已经发送过请求
                            res.send(JSON.stringify({
                                res:'已发送申请，请等待'
                            }))
                        }
                    }
                })
            }

        }
    })

})

//删除和拒绝
server.get('/refuseFriend',function (req,res) {
    var sql = 'select id from admin_table where username = ?';
    db.query(sql,req.query.username, function (err, data) {
        if(err){
            console.log(err)
        }else {
            var string=JSON.stringify(data);
            var data = JSON.parse(string);
            var id = data[0].id;

            sql = 'DELETE FROM friend where userid = ? and friendid = ?'
            db.query(sql,[id,req.session['userId']], function (err, data) {
                if(err){
                    console.log(err)
                }else{
                    db.query(sql,[req.session['userId'],id], function (err, data) {
                        if(err){
                            console.log(err)
                        }else{
                            res.send(JSON.stringify({
                                res:'ok'
                            }))
                        }
                    })
                }
            })

        }
    })
})

//同意添加
server.get('/allowFriend',function (req,res) {

    var sql = 'select id from admin_table where username = ?';
    db.query(sql,req.query.username, function (err, data) {
        if(err){
            console.log(err)
        }else {
            var string=JSON.stringify(data);
            var data = JSON.parse(string);
            var id = data[0].id;

            sql = 'update friend  set status = 1 where userid = ? and friendid = ?'
            db.query(sql,[id,req.session['userId']], function (err, data) {
                if(err){
                    console.log(err)
                }else{
                    db.query(sql,[req.session['userId'],id], function (err, data) {
                        if(err){
                            console.log(err)
                        }else{
                            res.send(JSON.stringify({
                                res:'ok'
                            }))
                        }
                    })
                }
            })

        }
    })
})

server.get('/findFriendsUnique',function (req,res) {
    var sql = 'select status from friend where userid=? ande friendid =?'
    db.query(sql,[req.query.name,req.query.friendName],function (err,data) {
        if(err){

        }else{
            data = JSON.parse(JSON.stringify(data));

            if(data.length==0){
                req.send(JSON.stringify({
                    res:'noThisFriend'
                }))
            }else{
                req.send(JSON.stringify({
                    res:'haveThisFriend'
                }))
            }
        }
    })
})

server.get('/change',function (req,res) {
    console.log(req.query)
    if(req.query.username){
        var sql = 'select id from admin_table where username = ?'
        db.query(sql,req.query.username,function (err,data) {
            if(err){
                console.log(err)
            }else{
                data = JSON.parse(JSON.stringify(data));
                if(data.length==0){
                   //可以修改
                    var sql = 'update admin_table set username = ? where username = ?'
                    db.query(sql,[req.query.username,req.query.user],function (err,data) {
                        if(err){
                            console.log(err)
                        }else {
                            res.send(JSON.stringify({
                                res:'ok'
                            }))
                        }
                    })

                }else{
                    //有重复的
                    res.send(JSON.stringify({
                        res:'no'
                    }))
                }
            }
        })
    }else if(req.query.password){
        var sql = 'update admin_table set pasword = ? where username = ?';
        db.query(sql,[req.query.password,req.query.user],function (err,data) {
                        if(err){
                            console.log(err)
                        }else {
                            res.send(JSON.stringify({
                                res:'ok'
                            }))
                        }
        })
    }else{
        var sql = 'update admin_table set describes = ? where username = ?;';
        db.query(sql,[req.query.describe,req.query.user],function (err,data) {
            if(err){
                console.log(err)
            }else {
                res.send(JSON.stringify({
                    res:'ok'
                }))
            }
        })
    }
})






server.use((req, res, next)=>{
    if(!req.session['userId'] && (req.url!='/login'&&req.url!='/register' )){ //没有登录
        res.redirect('/login');
    }else{
        next();
    }
});

server.get('/login',function (req,res) {
        res.sendFile(__dirname +'\\public\\loginall.html',function (err) {
            if(err)  console.log(err);
        });
})

server.get('/register',function (req,res) {
        res.sendFile(__dirname +'\\public\\upfile.html',function (err) {
            if(err)  console.log(err);
        });
})

server.get('/user',function (req,res) {
        res.sendFile(__dirname +'\\public\\user.html',function (err) {
            if(err)  console.log(err);
        });
})

server.get('/',function (req,res) {
    res.redirect('/login')
})

servers.listen(8081);