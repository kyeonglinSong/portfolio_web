var exportsList = module.exports = {};

const express = require('express');
const http = require('http');
const str_query = require('./routes/database/all_query');
const run_query = require('./routes/database/run_query');
const ejs = require('ejs')
const bodyParser = require('body-parser')

const main_router = require('./routes/main_router');  //router of board

// get DB connection
const conn = run_query.getconn()

//앱 세팅
app = express();
app.set('port', 3000);

//get user info START----------------------------------------------------------------------------
//유저 정보
var userInfoDict = {};

get_userInfo = function(){
    console.log("test fn")
    userInfoDict = {};
    conn.query(str_query.getUsersID, function(err, res, fields)
    {
        if (err)  return console.log(err);
        console.log(res);
        if(res.length)
        {
            for(var i = 0; i<res.length; i++ )
            {
                userInfoDict[res[i]['user_id']] = res[i]['password'];
            }
        }
    });

}
//get user info END----------------------------------------------------------------------------


//get resume info START----------------------------------------------------------------------------


let resume = [];
conn.query(str_query.getResume, function(err, res, fields)
{
    if (err)  return console.log(err);
    if(res.length)
    {
        for(var i = 0; i<res.length; i++ )
        {
            //console.log(res[i]);
            resume[resume.length] = {
                'seq' : res[i]['seq'],
                'comp_org' : res[i]['comp_org'],
                'question': res[i]['question'],
                'answer': res[i]['answer']
            };
            // resume.push('hi');
            // resume[i]['comp_org'] = res[i]['comp_org'];
            // resume[i]['question'] = res[i]['question'];
            // resume[i]['answer'] = res[i]['answer'];
        }
    }
    exportsList.resume_res = resume;
    //console.log(resume);
});
//console.log(resume);

//exportsList.resume_res = resume;
//get resume info END----------------------------------------------------------------------------



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
    get_userInfo();
    var sess = req.session;
    console.log(sess);
    if(!sess.logined)
        res.redirect('/login')
    else
        res.redirect('/main')
});

app.get('/login', (req, res) => {
    console.log(userInfoDict);
    //sess = req.session;
    res.render('login'); //세션에 
    //console.log(sess);
});

app.use('/main', main_router);

//클라에서 보내는 부분
app.post('/login', (req, res) => {
    sess = req.session;

    // !!!!!  user DB info////-------------------------------------------------------------------------
    if(req.body.id in userInfoDict){  
        if(req.body.pwd == userInfoDict[req.body.id]){ 
        sess.logined = true;
        sess.user_id = req.body.id;
        res.redirect('/')
        console.log(sess);
        } 
        else {
            res.send(`
            <h1>Who are you?</h1>
            <a href="/login">Back </a>
            `);
        }
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
        });
    }else{
        res.redirect('/');
    }
});

//signup START----------------------------------------------------------------------------
app.get('/signup', function(req, res){
    res.render('login/signup');
});

app.post('/signup', (req, res) => {
    
    var u_id = req.body.id;
    var u_pwd = req.body.pwd;
    var u_birth = req.body.birth;
    var u_email =  req.body.email;
    var u_phone = req.body.phone;
    var u_address = req.body.address;

    if(!u_id || !u_pwd || !u_birth || !u_email || !u_phone || !u_address){
        return res.send(`
            <h1>Invalid input, try again</h1>
            <a href="/signup">Back </a>
        `);
    }
    
    get_userInfo(); //refresh user info
    if(req.body.id in userInfoDict){
        return res.send(`
            <h1>ID already exists!</h1>
            <a href="/main">Back</a>
        `);
    }

    let userinfo = {
        user_id: u_id,
        password: u_pwd,
        birth: u_birth,
        email: u_email,
        phone: u_phone,
        address: u_address
    };
    
    let sql = 'INSERT INTO users SET ?'; 

    conn.query(sql, userinfo, (err, result, fields) => {
        if(err){ // 에러가 있으면
            console.log(err);
        }
        else {
            res.send(`
            <div style="text-align: center;">
            <h1 style="text-align: center;">SIGN UP success!</h1>
            <a href="/">go back to the SIGN IN page</a>
            </div>
            `);
        }
    });
    
});

//signup END----------------------------------------------------------------------------


// add 실행이 먼저 여기에 걸려야해서 여기랑 이 밑에 get함수 순서 바꿨엉! 
app.get('/competition/add', (req, res) => {
    var sql = 'select * from competitions';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
        } 
        res.render('comp/comp_add', {posts:posts});
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

/*
app.post('/topic/add', (req, res) => {
    
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    }
    else{  // 로그인 한 상태만 접근가능 
        var comp_name = req.body.comp_name;
        var comp_org = req.body.comp_org;
        var award_check = req.body.award_check;
        var awards_name =  req.body.awards_name;
        var proj_check = req.body.proj_check;
        var proj_name = req.body/proj_name;
        var user_id = req.body.user_id;
        var sql = 'insert into topic '
    }
});

*/


//서버 열기
app.listen(3000, (req, res) => {
    console.log("server start at port 3000");
});

