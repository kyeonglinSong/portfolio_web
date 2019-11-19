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
                        res.send(posts[0]);
                    }

                })
            } else{
                res.send(posts);
            }
        });
    }

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

