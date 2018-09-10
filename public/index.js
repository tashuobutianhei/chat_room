function send(value,hight,me,src,name){
        if(me){
            $('<div class="valueMe" style="top: '+hight+'px;">'+value+'</div>').prependTo('#content');
            $('<img data-name='+name+' class="valueMe2 talkhead" src='+src+' style="top: '+hight+'px;">').prependTo('#content');
        }else{
            $('<div class="valueOther" style="top: '+hight+'px;">'+value+'</div>').prependTo('#content');
            $('<img data-name='+name+' class="valueOther2 talkhead" src='+src+' style="top: '+hight+'px;">').prependTo('#content');
        }
    }
//设置cookie
function setcookie(room){
    var obj = JSON.parse($.cookie('user'));
    obj.room = room;
    $.cookie('user', JSON.stringify(obj), { expires: 7 ,path: '/'});
    console.log($.cookie('user'))
}
//找是否有此人
function find_firend(name){
    $.ajax({
        type: "get",
        url: 'http://localhost:8081/findFriend?username='+name,
        async: true,
        success: function (eve) {
            data = JSON.parse(eve);
            if (data.err ) {
                alert('查无此人')
            }else{
                alert(data.res);
            }
        },
        error: function () {
            console.log(555)
        }
    });
}
//初始化
function chushihua(){
    $.ajax({
        type: "get",
        url: "http://localhost:8081/look/",
        async: true,
        // beforeSend: function(req) {
        //     req.setRequestHeader("Connection", "close");
        // },
        success: function (eve) {
            data = JSON.parse(eve);
            console.log(data);

            username = data.username;
            head = data.head;
            describe = data.describes;

            $('#user>div:nth-of-type(3) p').text(describe)

            $('img').eq(0).attr('src', data.head);

            $('#content').eq(0).css({
                'background-size':'cover',
                'background-position':'center',
                'background-image':'url('+data.bg+')'
            });

            $('#head p').html(username);

            if($.cookie('user')){
                join(JSON.parse($.cookie('user')).room);
            }else{
                $.cookie('user', JSON.stringify({
                    username:username,
                    room:''
                }), { expires: 7 ,path: '/'});
            }

            data.friend.forEach(function (item,index,arr) {
                if (item.status == 0) {
                    $('#friends').append('<li data-name='+item.username+'><img src=' + item.head + ' class="iconImg">' + item.username + '(待审核)<img src="upfile/发消息.png" class="iconImg"></li>')
                } else if (item.status == 1) {
                    $('#friends').append('<li data-name='+item.username+'><img src=' + item.head + ' class="iconImg">' + item.username + '<span class="delete">删除好友</span><img src="upfile/发消息.png" class="iconImg private"></li>')
                } else if (item.status == -2) {
                    $('#friends').append('<li data-name='+item.username+'><img src=' + item.head + ' class="iconImg">' + item.username + '(新朋友)<span class="allow">同意</span><span class="refuse">拒绝</span></li>')
                }
            })

            data.list.forEach(function (item,index,arr) {
                $('#roomList').append('<li>'+item.roomname+'<div><img src="upfile/进入.png" class="iconImg">'+item.roomnum+'人</div></li>')
            })
        },
        error: function () {
            console.log(555)
        }
    });
}
//刷新后进入
function join (room){
    if(room){
        $('#now_room').html(room);
        setcookie(room);

        socket.emit("join", data, function (data) {
            console.log("消息发送：" + JSON.stringify(data));
        });

    }else{
        $('#now_room').html('暂无房间');
    }

}


window.onload=function () {

        var username,head,roomid,describe;
        var socket = io.connect();
        var hight=5;
        var flag = true;
        //初始化
        chushihua()
        //点头像判断是否唯一，然后加好友
        $('body').on('click','.talkhead',function (event) {
            var friendName  = $(event.target).attr('data-name');
            var name = JSON.parse($.cookie('user')).username;
            if(name == JSON.parse($.cookie('user')).username){
                //个人资料
                alert(friendName)
            }else {
                $.ajax({
                    type: "get",
                    url: "http://localhost:8081/findFriendsUnique?name="+name+'&friendName='+friendName,
                    async: true,
                    success: function (eve) {
                        eve = JSON.parse(eve);
                        if(eve.res=='noThisFriend'){
                            find_firend(name);
                        }else{

                        }
                    }
                })
            }
        })
        //收到消息
        socket.on("receiveMsg", function (data) {
            send(data.msg,hight,false,data.head,JSON.parse($.cookie('user')).username);
            hight+=45;
        });
        //发消息
        $('body').on('click','#send', function () {
            if($('#now_room').html()=='暂无房间'&&flag==true){
                alert('请先加入一个房间')
            }else{
                var value = $('#msg').val();
                if(/^p123/.test(roomid)){

                }else{
                    roomid = $('#room').val();
                }
                var data = {"msg": value, "roomName": roomid, "client": username,head:head};

                socket.emit("sendMsg", data, function (data) {
                    console.log("消息发送：" + JSON.stringify(data));
                });
                send(data.msg,hight,true,head,JSON.parse($.cookie('user')).username);
                hight+=45;
                $('#msg').val('');
            }
        })
        //点击房间标志进房
        $('body').on('click','#roomList li div',function (event) {
            if(JSON.parse($.cookie('user')).room){
                alert('你已经加入一房间了请先退出')
            }else{
                var str1 = $(event.target).parent().parent().text();
                var str2 = $(event.target).parent().text()
                room = str1.substring(0,str1.indexOf(str2))

                var data = {"roomName": room, "client": username};

                $.ajax({
                    type: "get",
                    url: 'http://localhost:8081/room?join='+room,
                    async: true,
                    success: function (eve) {
                        data2 = JSON.parse(eve);
                        if(data2.res=='no'){
                            alert('并没有这个房间哦')
                        }else {
                            $('#now_room').html(room);
                            setcookie(room);
                            for(var i = 0;i<$('#roomList li').length;i++){
                                var str1 = $('#roomList li').eq(i).text();
                                var str2 = $('#roomList li').eq(i).children('div').text();
                                roomname = str1.substring(0,str1.indexOf(str2))

                                if(roomname==room){
                                    $('#roomList li').eq(i).children('div').html('<img src="upfile/进入.png" class="iconImg">'+data2.num+'人');
                                }
                            }

                            socket.emit("join", data, function (data) {
                                console.log("消息发送：" + JSON.stringify(data));
                            });
                        }
                    }
                })
            }
        })
        //加入房间
        $('body').on('click','#join',function () {
            if(JSON.parse($.cookie('user')).room&&!/^p123/.test(JSON.parse($.cookie('user')).room)){
                alert('你已经加入一房间了请先退出');
                return ;
            }else if(/^p123/.test(JSON.parse($.cookie('user')).room)){
                var room = JSON.parse($.cookie('user')).room;
            }else{

                var room = $('#room').val();
            }
            var data = {"roomName": room, "client": username};
            $.ajax({
                type: "get",
                url: 'http://localhost:8081/room?join='+room,
                async: true,
                success: function (eve) {
                    data2 = JSON.parse(eve);
                    if(data2.res=='no'){
                        alert('并没有这个房间哦')
                    }else {
                        $('#now_room').html(room);
                        setcookie(room);
                        for(var i = 0;i<$('#roomList li').length;i++){
                            var str1 = $('#roomList li').eq(i).text();
                            var str2 = $('#roomList li').eq(i).children('div').text();
                            roomname = str1.substring(0,str1.indexOf(str2))

                            if(roomname==room){
                                $('#roomList li').eq(i).children('div').html('<img src="upfile/进入.png" class="iconImg">'+data2.num+'人');
                            }
                        }

                        socket.emit("join", data, function (data) {
                            console.log("消息发送：" + JSON.stringify(data));
                        });
                    }
                }
            })
        })
        //离开房间
        $('body').on('click', '#leave', function () {
            var room =JSON.parse($.cookie('user')).room;
            if(room){
                var data = {"roomName": room, "client": username};
                $.ajax({
                    type: "get",
                    url: 'http://localhost:8081/room?leave='+room,
                    async: true,
                    success: function (eve) {
                        data2 = JSON.parse(eve);
                        if(data2.res=='noroom'){
                            setcookie('');
                            $('#now_room').html('暂无房间');
                            $('#room').val('')

                            socket.emit("leave", data, function (data) {
                                console.log("消息发送：" + JSON.stringify(data));
                            });

                            for(var i = 0;i<$('#roomList li').length;i++){
                                if($('#roomList li').eq(i).text()==room){
                                    $('#roomList li').eq(i).remove();
                                }
                            }
                        }else{
                            setcookie('');
                            $('#now_room').html('暂无房间');
                            $('#room').val('')

                            socket.emit("leave", data, function (data) {
                                console.log("消息发送：" + JSON.stringify(data));
                            });

                            for(var i = 0;i<$('#roomList li').length;i++){
                                var str1 = $('#roomList li').eq(i).text();
                                var str2 = $('#roomList li').eq(i).children('div').text();
                                roomname = str1.substring(0,str1.indexOf(str2))
                                if(roomname==room){
                                    var num = $('#roomList li').eq(i).children('div').text().substring(0,$('#roomList li').eq(i).children('div').text().length-1)-1;
                                    $('#roomList li').eq(i).children('div').html('<img src="upfile/进入.png" class="iconImg">'+num+'人');
                                }
                            }

                        }
                    },
                    error: function () {
                        console.log(555)
                    }

                });
            }else{
                alert('你当前还没有加入房间哦')
            }
        })
        //退出登录
        $('body').on('click', '#out', function () {
            var url = "http://localhost:8081/out/";
            $.ajax({
                type: "get",
                url: url,
                async: true,
                success: function (eve) {
                    data = JSON.parse(eve);
                    console.log(data);
                    if (data.res == 'ok') {
                        if (confirm('是否退出登录')) {
                            $.cookie('user', '');
                            //   $.cookie('cookieName', 'cookieValue', { expires: 7, path: '/' });
                            window.location.replace('./login');
                        }
                    }
                },
                error: function () {
                    console.log(555)
                }

            });
        })
        //回车事件
        $(document).keyup(function(event){
            if(event.keyCode ==13){
                $("#send").trigger("click");
            }
        })
        //设置列表的出现
        $('body').on('click','#head img:nth-of-type(2)',function () {
            $('#head ul').slideToggle()
        })
        //设置背景form的出现
        $('body').on('click','#head ul li:nth-of-type(1)',function () {
            $('#change_bg').slideToggle()
        })
        //更换背景
        $('body').on('click','#change_bg button',function () {
            var url = "http://localhost:8081/upbg";
            $.ajax({
                type:"POST",
                url:url,
                async:true,
                data:new FormData($('form')[0]),
                processData: false,
                contentType: false,
                success:function(eve){
                    data = JSON.parse(eve);
                    if(data.err){
                        alert(data.err);
                    }else{
                        alert(data.ok);
                        console.log(data)
                        $('#content').eq(0).css('background-image','url('+data.src+') ');
                    }
                },
                error:function(){
                    console.log(555)
                }

            });
        });
        //清屏
        $('body').on('click','#clear',function () {

            $('#content').empty();
            hight=0;
            if(flag==false){
                $('#content').append('<span style="position: absolute;left: 38%;">私聊中.......</span><span class="quit_private" style="cursor: pointer">离开私聊</span>')
            }
        })
        //好友搜索出现
        $('body').on('click','#friends span:nth-of-type(2)',function () {
            $('#find_firend').slideToggle()
        })
        //关闭
        $('body').on('click','.close',function (event) {
            $(event.target).parent().slideToggle();
        })
        //查找好友
        $('body').on('click','#find_firend button',function () {
            $.ajax({
                type: "get",
                url: 'http://localhost:8081/findFriend?username='+$('#find_firend input').val(),
                async: true,
                success: function (eve) {
                    data = JSON.parse(eve);
                    if (data.err ) {
                        alert('查无此人')
                    }else{
                        alert(data.res);
                    }
                },
                error: function () {
                    console.log(555)
                }

            });
        })
        //通过好友请求
        $('body').on('click','.allow',function (event) {
            var name  = $(event.target).parent().attr('data-name');
            var head  = $(event.target).parent().children('img').attr('src');

            $.ajax({
                type: "get",
                url: 'http://localhost:8081/allowFriend?username='+$(event.target).parent().attr('data-name'),
                async: true,
                success: function (eve) {
                    for(var i=0;i< $('#friends li').length;i++){
                        if($('#friends li').eq(i).attr('data-name')==name){
                            $('#friends li').eq(i).detach();
                        }
                    }
                    $('#friends').append('<li data-name='+name+'><img src=' + head + ' class="iconImg">' + name + '<span class="delete">删除好友</span><img src="upfile/发消息.png" class="iconImg"></li>')

                },
                error: function () {
                    console.log(555)
                }

            });
        })
        //拒绝好友请求
        $('body').on('click','.refuse',function (event) {
            var name  = $(event.target).parent().attr('data-name');

            $.ajax({
                type: "get",
                url: 'http://localhost:8081/refuseFriend?username='+$(event.target).parent().attr('data-name'),
                async: true,
                success: function (eve) {
                    for(var i=0;i< $('#friends li').length;i++){
                        if($('#friends li').eq(i).attr('data-name')==name){
                            $('#friends li').eq(i).detach();
                        }
                    }
                },
                error: function () {
                    console.log(555)
                }

            });
        })
        //删除好友
        $('body').on('click','.delete',function (event) {
            var name  = $(event.target).parent().attr('data-name');

            $.ajax({
                type: "get",
                url: 'http://localhost:8081/refuseFriend?username='+$(event.target).parent().attr('data-name'),
                async: true,
                success: function (eve) {
                    for(var i=0;i< $('#friends li').length;i++){
                        if($('#friends li').eq(i).attr('data-name')==name){
                            $('#friends li').eq(i).detach();
                        }
                    }
                },
                error: function () {
                    console.log(555)
                }

            });
        })
        //发消息进入私聊
        socket.on("privateMsg", function (data) {
            console.log(data)
            if($('#head p').text()==data.friend){
                alert('进入私聊')
                roomid = 'p123'+data.userid+data.friendid;
                setcookie(roomid);

                $('#join').trigger('click');

                var data2 = {"roomName": roomid, "client": username};

                socket.emit("join", data2, function (data) {
                    console.log("消息发送：" + JSON.stringify(data));
                });
                flag=false;
                $('#content').append('<span style="position: absolute;left: 38%;">私聊中.......</span><span class="quit_private">离开私聊</span>')
            }else if ($('#head p').text()==data.client) {
                alert('进入私聊')

                roomid = 'p123'+data.userid+data.friendid;
                setcookie(roomid)

                $('#join').trigger('click');

                var data2 = {"roomName": roomid, "client": username};

                socket.emit("join", data2, function (data) {
                    console.log("消息发送：" + JSON.stringify(data));
                });
                flag=false;
                $('#content').append('<span style="position: absolute;left: 38%;">私聊中.......</span><span class="quit_private">离开私聊</span>')
            }else{

            }


        });
        //私聊标志进入
        $('body').on('click','.private',function () {

            var data = {"client": username,friend:$(event.target).parent().attr('data-name')};

            socket.emit("private", data, function (data) {
                console.log("消息发送：" + JSON.stringify(data));
            });

        })
        //退出私聊
        $('body').on('click','.quit_private',function () {
            var data = {"roomName": roomid, "client": username};
            setcookie('')
            $('#leave').trigger('click');
            $('#now_room').html('暂无房间');
            alert('已退出好友私聊');
            roomid='';
            $('#content').empty();
            hight=0;
            socket.emit("leave", data, function (data) {
                console.log("消息发送：" + JSON.stringify(data));
            });
        })
        //创建房间
        $('body').on('click','#create',function () {
            if(JSON.parse($.cookie('user')).room){
                alert('你已经加入一房间了请先退出')
            }else{
                if (/^p123/.test(roomid)) {

                }else {
                    roomid = $('#room').val();
                }
                if(roomid.length>0){
                    $.ajax({
                        type: "get",
                        url: "http://localhost:8081/create?room=" + roomid,
                        async: true,
                        success: function (eve) {
                            data = JSON.parse(eve);
                            if(data.res=='ok'){
                                setcookie(roomid);
                                alert('创建成功');

                                $('#roomList').append('<li>'+data.roomname+'<div><img src="upfile/进入.png" class="iconImg">1人</div></li>')
                                var result = {"roomName":data.roomname, "client": username};
                                $('#now_room').html(data.roomname);

                                socket.emit("join", result, function (data) {
                                    console.log("消息发送：" + JSON.stringify(data));
                                });
                            }else{
                                alert('该房间已经被创立');
                            }
                        },
                        error: function () {

                        }
                    })
                }else{
                    alert('给取个名字呗')
                }

            }
        })
        //修改信息
        $('body').on('click','.changeit',function (event) {
            var log = $(event.target).prev().prev().text();
            console.log(log)
            if(log=='用户名:'){
                $(event.target).parent().replaceWith('<div>\n' +
                    '            <span>用户名:</span>\n' +
                    '            <input placeholder="输入新的用户名">\n' +
                    '            <button>确认修改</button>\n' +
                    '        </div>')
            }else{
                $(event.target).parent().replaceWith('<div>\n' +
                    '            <span>密码:</span>\n' +
                    '            <input placeholder="输入新的密码">\n' +
                    '            <button>确认修改</button>\n' +
                    '        </div>')
            }
        })
        //修改的情况
        $('body').on('click','#head li:nth-of-type(2)',function () {
            $('#user').fadeIn();
            $('#user').css('display','flex');
            $('#user>div:nth-of-type(2)>img').attr('src',head);
            $('#user>div:nth-of-type(2)>div:nth-of-type(1)>span:nth-of-type(2)').text(JSON.parse($.cookie('user')).username);
        })
        //关闭修改的
        $('body').on('click','#headClose',function () {
            $('#user').css('display','none')
        })
        //修改个人信息
        $('body').on('click','#changemy',function (event) {
            $(event.target).parent().append('<button id="ready_changemy">确定</button>')
            $('#user>div:nth-of-type(3) p').html('<textarea style="width: 90%;height: 60px;background-color: rgba(50,50,50,.5);margin-left: 20px"></textarea>');

        })
        //确认修改
        $('body').on('click','#ready_changemy',function () {
            var describe = $('textarea').val();
            $.ajax({
                type: "get",
                url: "http://localhost:8081/change?describe=" +describe+'&user='+JSON.parse($.cookie('user')).username,
                async: true,
                success: function (eve) {
                    var data = JSON.parse(eve);
                    $('#user>div:nth-of-type(3) p').text(describe);
                }

            })

        })
        //修改用户名和密码
        $('body').on('click','#user>div:nth-of-type(2) div button',function (event) {
            var log = $(event.target).prev().prev().text();
            if(log=='用户名:'){
                var name = $(event.target).prev().val();
                $.ajax({
                    type: "get",
                    url: "http://localhost:8081/change?username=" +name+'&user='+JSON.parse($.cookie('user')).username,
                    async: true,
                    success: function (eve) {
                        console.log(eve)
                        data = JSON.parse(eve);
                        if(data.res=='ok'){
                            alert('修改成功');
                            obj = JSON.parse($.cookie('user'))
                            obj.username =  name;
                            $.cookie('user',JSON.stringify(obj));


                            $(event.target).parent().replaceWith(' <div>\n' +
                                '            <span>用户名:</span>\n' +
                                '            <span>'+name+'</span>\n' +
                                '            <img class=\'changeit\' src="upfile/公共-修改.png">\n' +
                                '        </div>');

                            $('head p').text(name);
                        }else{
                            alert('这个名字被用了哦')
                        }
                    }
                })
            }else{
                var password=$(event.target).prev().val();
                $.ajax({
                    type: "get",
                    url: "http://localhost:8081/change/?password=" +password+'&user='+JSON.parse($.cookie('user')).username,
                    async: true,
                    success: function (eve) {
                        data = JSON.parse(eve);
                        if(data.res=='ok'){
                            alert('修改成功');

                            $(event.target).parent().replaceWith(' <div>\n' +
                                '            <span>密码:</span>\n' +
                                '            <span>***********</span>\n' +
                                '            <img class=\'changeit\' src="upfile/公共-修改.png">\n' +
                                '        </div>');
                        }
                    }
                })
            }
        })
    }
