const express = require('express');
const http = require('http');
const str_query = require('./routes/database/all_query');
const run_query = require('./routes/database/run_query');
const ejs = require('ejs')
const bodyParser = require('body-parser')

// db run
query = str_query.testquery; //쿼리 받아옴
conn = run_query.getconn()
query_res = run_query.testrun(conn, query); //쿼리 실행

//앱 세팅
app = express();
app.set('port', 3000);

//세션
var session = require('express-session');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
 secret: '@#@$MYSIGN#@$#$',
 resave: false,
 saveUninitialized: true
}));

app.get('/', function (req, res) {
    var sess = req.session;
    //console.log(sess);
    if(!sess.logined)
        res.redirect('/login')
    else
        res.redirect('/main')
});

//회원 정보
let user = {      //회원 정보
    user_id: "doky",
    user_pwd: "1111"
};

app.get('/login', (req, res) => {
    sess = req.session;
    res.render('login'); //세션에 
    //console.log(sess);
});


app.get('/main', (req, res) => {
    sess = req.session;
    res.render('main'); //세션에 
    //console.log(sess);
});

//클라에서 보내는 부분
app.post('/login', (req, res) => {
    sess = req.session;
    if(req.body.id == user.user_id && req.body.pwd == user.user_pwd){
        sess.logined = true;
        sess.user_id = req.body.id;
        res.redirect('/main')
        // res.render('logout', { id: req.session.user_id });
    } 
    else {
    res.send(`
      <h1>Who are you?</h1>
      <a href="/login">Back </a>
    `);}
});

// logout
app.get('/logout', function(req, res){
    sess = req.session;
    if(sess.id){ 
        req.session.destroy(function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect('/');
            }
        })
    }else{
        res.redirect('/');
    }
});

// 글 추가
app.get(['/competition/add'], (req, res) => {
    var sql = 'select * from competitions';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send('internal server error');
        } 
        res.render('comp/comp_add', {posts:posts});
    });
});

app.post('/competition/add', (req, res) => {
    var comp_name = req.body.comp_name || req.query.comp_name;
    var comp_org = req.body.comp_org || req.query.comp_org;
    var awards_check = req.body.awards_check;
    var awards_name =  req.body.awards_name;
    var proj_check = req.body.proj_check || req.query.proj_check;
    var proj_name = req.body.proj_name || req.query.proj_name;
    var user_id = req.body.user_id || req.query.user_id;
    var sql = 'insert into competitions(comp_name, comp_org, awards_check, awards_name, proj_check, proj_name, user_id) values(?, ?, ?, ?, ?, ?, ?)';
    conn.query(sql, [comp_name, comp_org, awards_check, awards_name, proj_check, proj_name, user_id], (err, result, fields)=> {
        if(err){
            console.log(err);
            console.log("데이터 추가 에러");
            res.status(500).send("internal server error");
        } else {
            res.redirect('/competition');
        }
    });
});

// competition 게시판
// 1. GET competition
// 2. GET competiton/:seq
app.get(['/competition', '/competition/:seq'],(req, res) => {
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    }
else{  // 로그인 한 상태만 접근가능

    var sql = 'SELECT * FROM competitions';  // 수상목록들 가져옴. 근데 db에서 아이디인증 가능하면 바꿀거임
        conn.query(sql, (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
            console.log(seq);
            // 만약 competition/:id 로 들어왔다면 (글 상세보기)
            if(seq) {
                var sql = 'SELECT * FROM competitions WHERE seq=?'; 
                conn.query(sql, [seq], (err, posts, fields) => {
                    if(err){ // 에러가 있으면
                        console.log(err);
                    } else { // 에러가 없으면
                        res.render('comp/comp_detail', {posts:posts, post:posts[0]})
                    }

                })
            } else{
                //res.send(posts);
                res.render('comp/competition', {posts:posts});
            }
        });
    }

});



// 글 수정 : GET competition/:seq/edit
app.get(['/competition/:seq/edit'], (req, res) => {
    var sql = 'select * from competitions';
    conn.query(sql, (err, posts, fields) => {
        var seq = req.params.seq;
        if(seq) {
            var sql = 'select * from competitions where seq=?';
            conn.query(sql, [seq], (err, posts, fileds) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.render('comp/comp_edit', {posts:posts, post:posts[0]});
                }
            });
        } else {
            console.log('there is no id');
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post(['/competition/:seq/edit'], (req, res) => {
    
    var comp_name = req.body.comp_name;
    var comp_org = req.body.comp_org;
    var awards_check = req.body.awards_check;
    var awards_name =  req.body.awards_name;
    var proj_check = req.body.proj_check;
    var proj_name = req.body.proj_name;
    var user_id = req.body.user_id; 
    var seq = req.params.seq;

    var sql = 'update competitions set comp_name=?, comp_org=?, awards_check=?, awards_name=?, proj_check=?, proj_name=?, user_id=? where seq=?';
    conn.query(sql, [comp_name, comp_org, awards_check, awards_name, proj_check, proj_name, user_id, seq], (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send("internal server error");
        } else {
            res.redirect('/competition/'+seq);
        }
    });
});



// 3. GET competition/:seq/delete
app.get('/competition/:seq/delete', (req, res) => {
    var sql = 'select seq, comp_name from competitions';
    var seq = req.params.seq;

    conn.query(sql, (err, posts, fields) => {
        var sql = 'select * from competitions where seq=?';
        conn.query(sql, [seq], (err, posts) => {
            if(err) {
                console.log(err);
                res.status(500).send('internal server error1');
            } else {
                if(posts.length === 0) {
                    console.log('레코드가 없어용');
                    res.status(500).send('internal server error2');
                } else {
                    res.render('comp/comp_delete', {posts:posts, post:posts[0]});
                }
            }
        });
    });
});

// 4. POST competition/:seq/delete - yes 버튼을 눌렀을 때 정말 삭제
app.post('/competition/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from competitions where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/competition');
    });
});


// main
app.post('/main', function(req, res){
    sess = req.session;
    //sess.logined = false;
    res.redirect('/logout');
});


//서버 열기
app.listen(3000, (req, res) => {
    console.log("server start at port 3000");
});

