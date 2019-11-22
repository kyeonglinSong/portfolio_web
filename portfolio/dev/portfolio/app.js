var exportsList = module.exports = {};

const express = require('express');
const http = require('http');
const str_query = require('./routes/database/all_query');
const run_query = require('./routes/database/run_query');
const ejs = require('ejs')
const bodyParser = require('body-parser')

const main_router = require('./routes/main_router');  //router of board

// get DB connection
const conn = run_query.getconn();
exportsList.conn = conn;

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


// let resume = [];
// conn.query(str_query.getResume, function(err, res, fields)
// {
//     if (err)  return console.log(err);
//     if(res.length)
//     {
//         for(var i = 0; i<res.length; i++ )
//         {
//             //console.log(res[i]);
//             resume[resume.length] = {
//                 'seq' : res[i]['seq'],
//                 'comp_org' : res[i]['comp_org'],
//                 'question': res[i]['question'],
//                 'answer': res[i]['answer']
//             };
//             // resume.push('hi');
//             // resume[i]['comp_org'] = res[i]['comp_org'];
//             // resume[i]['question'] = res[i]['question'];
//             // resume[i]['answer'] = res[i]['answer'];
//         }
//     }
//     exportsList.resume_res = resume;
//     console.log(resume);
// });
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
            sess.password = req.body.pwd;
            res.redirect('/')
            console.log(sess);
        } 
        else {
            res.send(`
            <h1>Who are you?</h1>
            <a href="/">Back </a>
            `);
        }
    }
    else {
    res.send(`
      <h1>Who are you?</h1>
      <a href="/">Back </a>
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
                console.log("여기 뜸");
                res.redirect('/');
            }
        });
    }else{
        console.log("아냐 여기뜸");
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


// -----------profile로 들어가기

app.get('/profile', (req, res) => {
    sess = req.session;

    if(!sess.logined) {
       
        res.send(`
        <div style="text-align: center;">
        <h1>Who are you?</h1>
        <a href="/">Back </a>
        </div>
      `);
    
    } else {

        var user_id = sess.user_id;
        let sql = "select * from users where user_id=?"
        conn.query(sql, [user_id], (err, post) => {
            res.render('profile', {user_id: sess.user_id, post:post[0]});
       
        }); 

    }

})
// delete account
app.post('/profile/:user_id/deleteAcount', (req, res) => {
    sess = req.session;
    console.log(sess);
    user_id = sess.user_id;

    var sql = 'delete from users where user_id=?';
    conn.query(sql, [user_id], (err, result) => {
        res.redirect('/logout');
    });
});

app.get('/profile/:user_id/deleteAcount', (req, res) => {
    sess = req.session;
    console.log(sess);
    res.render('login/deleteAcount', {user_id:sess.user_id}); //세션에 
});


// edit users 
app.post('/profile/:user_id/edit', (req, res) => {
    sess = req.session;
    console.log("EDIT SESS")
    console.log(sess);

    if(req.body.password!=sess.password){
        return res.send(`
        <div style="text-align: center;">
        <h1>Invalid password...!</h1>
        <a href="/">Back</a>
        </div>
        `);
    }
    console.log(req.body);
    let userinfo = [
        sess.user_id,
        sess.password,
        req.body.birth,
        req.body.email,
        req.body.phone,
        req.body.address,
        sess.user_id
    ];

    let sql = 'UPDATE users SET user_id=?, password=?, birth=?, email=?, phone=?, address=? WHERE user_id=?';
    conn.query(sql, userinfo, (err, result) => {
        console.log(result);
        return res.send(`
        <div style="text-align: center;">
        <h1>Edit Successfully</h1>
        <a href="/">Back</a>
        </div>
        `);
    });
});

app.get('/profile/:user_id/edit', (req, res) => {
    sess = req.session;
    console.log(sess);
    let sql = "select * from users where user_id=?"
    conn.query(sql, [sess.user_id], (err, post) => {
        console.log("EDIT!")
        console.log(post)
        res.render('login/mypage_edit', {user_id:sess.user_id, post:post[0]});
    });
});

/// ---- profile 끝

//----------------- 1/6. competition 게시판 ----------------------------------------------

// 1-1. competiton 게시판 글 생성
app.get('/competition/add', (req, res) => {
    var sql = 'select * from competitions';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
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

// 1-2. competition 게시판 글목록 보기, 글 상세보기
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
    var user_id = sess.user_id;  // 이걸로 내 아이디로 작성한 글만 판별해서 보여줄것임
    var sql = 'SELECT * FROM competitions where user_id=?';  
        conn.query(sql, [user_id], (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
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


// 1-3. competition 게시글 수정
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


// 1-4. competition 게시글 삭제
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

// 글 삭제 - yes 버튼을 눌렀을 때 정말 삭제
app.post('/competition/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from competitions where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/competition');
    });
});

//--------------- 1. comptition 끝 ----------------------------------------------


//--------------- 2. project 시작 ------------------------

// 2-1. project 게시판에 글 추가하기
app.get('/project/add', (req, res) => {
    var sql = 'select * from projects';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
        } 
        res.render('proj/proj_add', {posts:posts});
    });
});

app.post('/project/add', (req, res) => {
    var proj_name = req.body.proj_name;
    var proj_description = req.body.proj_description;
    var url = req.body.url;
    var user_id = req.body.user_id || req.query.user_id;
    var sql = 'insert into projects(proj_name, proj_description, url, user_id) values(?, ?, ?, ?)';
    conn.query(sql, [proj_name, proj_description, url, user_id], (err, result, fields)=> {
        if(err){
            console.log(err);
            console.log("데이터 추가 에러");
            res.status(500).send("internal server error");
        } else {
            res.redirect('/project');
        }
    });
});

// 2-2. project 게시판 글목록 보기, 글 상세보기
app.get(['/project', '/project/:seq'],(req, res) => {
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    }
else{  // 로그인 한 상태만 접근가능
    var user_id = sess.user_id;  // 이걸로 내 아이디로 작성한 글만 판별해서 보여줄것임
    var sql = 'SELECT * FROM projects where user_id=?';  
        conn.query(sql, [user_id], (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
            // 만약 project/:id 로 들어왔다면 (글 상세보기)
            if(seq) {
                var sql = 'SELECT * FROM projects WHERE seq=?'; 
                conn.query(sql, [seq], (err, posts, fields) => {
                    if(err){ // 에러가 있으면
                        console.log(err);
                    } else { // 에러가 없으면
                        res.render('proj/proj_detail', {posts:posts, post:posts[0]})
                    }

                })
            } else{
                //res.send(posts);
                res.render('proj/project', {posts:posts});
            }
        });
    }

});


// 2-3. project 게시글 수정
app.get(['/project/:seq/edit'], (req, res) => {
    var sql = 'select * from projects';
    conn.query(sql, (err, posts, fields) => {
        var seq = req.params.seq;
        if(seq) {
            var sql = 'select * from projects where seq=?';
            conn.query(sql, [seq], (err, posts, fileds) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.render('proj/proj_edit', {posts:posts, post:posts[0]});
                }
            });
        } else {
            console.log('there is no id');
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post(['/project/:seq/edit'], (req, res) => {
    
    var proj_name = req.body.proj_name;
    var proj_description = req.body.proj_description;
    var url = req.body.url;
    var user_id = req.body.user_id || req.query.user_id;
    var seq = req.params.seq;

    var sql = 'update projects set proj_name=?, proj_description=?, url=?, user_id=? where seq=?';
    conn.query(sql, [proj_name, proj_description, url, user_id, seq], (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send("internal server error");
        } else {
            res.redirect('/project/'+seq);
        }
    });
});


// 2-4. project 게시글 삭제
app.get('/project/:seq/delete', (req, res) => {
    var sql = 'select seq, comp_name from projects';
    var seq = req.params.seq;

    conn.query(sql, (err, posts, fields) => {
        var sql = 'select * from projects where seq=?';
        conn.query(sql, [seq], (err, posts) => {
            if(err) {
                console.log(err);
                res.status(500).send('internal server error1');
            } else {
                if(posts.length === 0) {
                    console.log('레코드가 없어용');
                    res.status(500).send('internal server error2');
                } else {
                    res.render('proj/proj_delete', {posts:posts, post:posts[0]});
                }
            }
        });
    });
});

// 글 삭제 - yes 버튼을 눌렀을 때 정말 삭제
app.post('/project/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from projects where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/project');
    });
});



//--------------- 2. project 끝 -----------------------------------------

//--------------- 3. resume 시작 ------------------------------------------

// 3-1. resume 게시판에 글 추가하기
app.get('/resume/add', (req, res) => {
    var sql = 'select * from resume';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
        } 
        res.render('resu/res_add', {posts:posts});
    });
});

app.post('/resume/add', (req, res) => {
    var company = req.body.company;
    var text = req.body.text;
    var user_id = req.body.user_id || req.query.user_id;
    var sql = 'insert into resume(company, text, user_id) values(?, ?, ?)';
    conn.query(sql, [company, text, user_id], (err, result, fields)=> {
        if(err){
            console.log(err);
            console.log("데이터 추가 에러");
            res.status(500).send("internal server error");
        } else {
            res.redirect('/resume');
        }
    });
});

// 3-2. resume 게시판 글목록 보기, 글 상세보기
app.get(['/resume', '/resume/:seq'],(req, res) => {
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    }
else{  // 로그인 한 상태만 접근가능
    var user_id = sess.user_id;  // 이걸로 내 아이디로 작성한 글만 판별해서 보여줄것임
    var sql = 'SELECT * FROM resume where user_id=?';  
        conn.query(sql, [user_id], (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
            // 만약 project/:id 로 들어왔다면 (글 상세보기)
            if(seq) {
                var sql = 'SELECT * FROM resume WHERE seq=?'; 
                conn.query(sql, [seq], (err, posts, fields) => {
                    if(err){ // 에러가 있으면
                        console.log(err);
                    } else { // 에러가 없으면
                        res.render('resu/res_detail', {posts:posts, post:posts[0]})
                    }

                })
            } else{
                //res.send(posts);
                res.render('resu/resume', {posts:posts});
            }
        });
    }

});


// 3-3. resume 게시글 수정
app.get(['/resume/:seq/edit'], (req, res) => {
    var sql = 'select * from resume';
    conn.query(sql, (err, posts, fields) => {
        var seq = req.params.seq;
        if(seq) {
            var sql = 'select * from resume where seq=?';
            conn.query(sql, [seq], (err, posts, fileds) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.render('resu/res_edit', {posts:posts, post:posts[0]});
                }
            });
        } else {
            console.log('there is no id');
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post(['/resume/:seq/edit'], (req, res) => {
    
    var company = req.body.company;
    var text = req.body.text;
    var user_id = req.body.user_id || req.query.user_id;
    var seq = req.params.seq;

    var sql = 'update resume set company=?, text=?, user_id=? where seq=?';
    conn.query(sql, [company, text, user_id, seq], (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send("internal server error");
        } else {
            res.redirect('/resume/'+seq);
        }
    });
});


// 3-4. resume 게시글 삭제
app.get('/resume/:seq/delete', (req, res) => {
    var sql = 'select seq, comp_name from resume';
    var seq = req.params.seq;

    conn.query(sql, (err, posts, fields) => {
        var sql = 'select * from resume where seq=?';
        conn.query(sql, [seq], (err, posts) => {
            if(err) {
                console.log(err);
                res.status(500).send('internal server error1');
            } else {
                if(posts.length === 0) {
                    console.log('레코드가 없어용');
                    res.status(500).send('internal server error2');
                } else {
                    res.render('resu/res_delete', {posts:posts, post:posts[0]});
                }
            }
        });
    });
});

// 글 삭제 - yes 버튼을 눌렀을 때 정말 삭제
app.post('/resume/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from resume where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/resume');
    });
});

//-----------------3. resume 끝 ----------------------------


//----------------- 4. certification 게시판 ----------------------------------------------

// 4-1. certification 게시판 글 생성
app.get('/certification/add', (req, res) => {
    var sql = 'select * from certifications';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
        } 
        res.render('cert/cert_add', {posts:posts});
    });
});

app.post('/certification/add', (req, res) => {
    var cert_name = req.body.cert_name;
    var cert_num = req.body.cert_num;
    var issuing_org = req.body.issuing_org;
    var issuing_date =  req.body.issuing_date;
    var expiration_date = req.body.expiration_date;
    var user_id = req.body.user_id || req.query.user_id;
    var sql = 'insert into certifications(cert_name, cert_num, issuing_org, issuing_date, expiration_date, user_id) values(?, ?, ?, ?, ?, ?)';
    conn.query(sql, [cert_name, cert_num, issuing_org, issuing_date, expiration_date, user_id], (err, result, fields)=> {
        if(err){
            console.log(err);
            console.log("데이터 추가 에러");
            res.status(500).send("internal server error");
        } else {
            res.redirect('/certification');
        }
    });
});

// 4-2. certification 게시판 글목록 보기, 글 상세보기
app.get(['/certification', '/certification/:seq'],(req, res) => {
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    }
else{  // 로그인 한 상태만 접근가능
    var user_id = sess.user_id;  // 이걸로 내 아이디로 작성한 글만 판별해서 보여줄것임
    var sql = 'SELECT * FROM certifications where user_id=?';  
        conn.query(sql, [user_id], (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
            // 만약 certification/:id 로 들어왔다면 (글 상세보기)
            if(seq) {
                var sql = 'SELECT * FROM certifications WHERE seq=?'; 
                conn.query(sql, [seq], (err, posts, fields) => {
                    if(err){ // 에러가 있으면
                        console.log(err);
                    } else { // 에러가 없으면
                        res.render('cert/cert_detail', {posts:posts, post:posts[0]})
                    }

                })
            } else{
                //res.send(posts);
                res.render('cert/certification', {posts:posts});
            }
        });
    }

});


// 4-3. certification 게시글 수정
app.get(['/certification/:seq/edit'], (req, res) => {
    var sql = 'select * from certifications';
    conn.query(sql, (err, posts, fields) => {
        var seq = req.params.seq;
        if(seq) {
            var sql = 'select * from certifications where seq=?';
            conn.query(sql, [seq], (err, posts, fileds) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.render('cert/cert_edit', {posts:posts, post:posts[0]});
                }
            });
        } else {
            console.log('there is no id');
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post(['/certification/:seq/edit'], (req, res) => {
    
    var cert_name = req.body.cert_name; 
    var cert_num = req.body.cert_num;
    var issuing_org = req.body.issuing_org;
    var issuing_date =  req.body.issuing_date;
    var expiration_date = req.body.expiration_date;
    var user_id = req.body.user_id || req.query.user_id;
    var seq = req.params.seq;

    var sql = 'update certifications set cert_name=?, cert_num=?, issuing_org=?, issuing_date=?, expiration_date=?, user_id=? where seq=?';
    conn.query(sql, [cert_name, cert_num, issuing_org, issuing_date, expiration_date, user_id, seq], (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send("internal server error");
        } else {
            res.redirect('/certification/' + seq);
        }
    });
});


// 4-4. certification 게시글 삭제
app.get('/certification/:seq/delete', (req, res) => {
    var sql = 'select seq, cert_name from certifications';
    var seq = req.params.seq;

    conn.query(sql, (err, posts, fields) => {
        var sql = 'select * from certifications where seq=?';
        conn.query(sql, [seq], (err, posts) => {
            if(err) {
                console.log(err);
                res.status(500).send('internal server error1');
            } else {
                if(posts.length === 0) {
                    console.log('레코드가 없어용');
                    res.status(500).send('internal server error2');
                } else {
                    res.render('cert/cert_delete', {posts:posts, post:posts[0]});
                }
            }
        });
    });
});

// 글 삭제 - yes 버튼을 눌렀을 때 정말 삭제
app.post('/certification/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from certifications where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/certification');
    });
});

//--------------- 4. certification 끝 ----------------------------------------------

//----------------- 5. test게시판 ----------------------------------------------

// 5-1. test 게시판 글 생성
app.get('/test/add', (req, res) => {
    var sql = 'select * from tests';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
        } 
        res.render('test/test_add', {posts:posts});
    });
});

app.post('/test/add', (req, res) => {
    var test_name = req.body.test_name;
    var score = req.body.score; 
    var issuing_org = req.body.issuing_org;
    var issuing_date =  req.body.issuing_date;
    var expiration_date = req.body.expiration_date;
    var user_id = req.body.user_id || req.query.user_id;
    var sql = 'insert into tests(test_name, score, issuing_org, issuing_date, expiration_date, user_id) values(?, ?, ?, ?, ?, ?)';
    conn.query(sql, [test_name, score, issuing_org, issuing_date, expiration_date, user_id], (err, result, fields)=> {
        if(err){
            console.log(err);
            console.log("데이터 추가 에러");
            res.status(500).send("internal server error");
        } else {
            res.redirect('/test');
        }
    });
});

// 5-2. test 게시판 글목록 보기, 글 상세보기
app.get(['/test', '/test/:seq'],(req, res) => {
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    }
else{  // 로그인 한 상태만 접근가능
    var user_id = sess.user_id;  // 이걸로 내 아이디로 작성한 글만 판별해서 보여줄것임
    var sql = 'SELECT * FROM tests where user_id=?';  
        conn.query(sql, [user_id], (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
            // 만약 test/:id 로 들어왔다면 (글 상세보기)
            if(seq) {
                var sql = 'SELECT * FROM tests WHERE seq=?'; 
                conn.query(sql, [seq], (err, posts, fields) => {
                    if(err){ // 에러가 있으면
                        console.log(err);
                    } else { // 에러가 없으면
                        res.render('test/test_detail', {posts:posts, post:posts[0]})
                    }

                })
            } else{
                //res.send(posts);
                res.render('test/test_main', {posts:posts});
            }
        });
    }

});


// 5-3. test 게시글 수정
app.get(['/test/:seq/edit'], (req, res) => {
    var sql = 'select * from tests';
    conn.query(sql, (err, posts, fields) => {
        var seq = req.params.seq;
        if(seq) {
            var sql = 'select * from tests where seq=?';
            conn.query(sql, [seq], (err, posts, fileds) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.render('test/test_edit', {posts:posts, post:posts[0]});
                }
            });
        } else {
            console.log('there is no id');
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post(['/test/:seq/edit'], (req, res) => {
    
    var test_name = req.body.test_name; 
    var score = req.body.score;
    var issuing_org = req.body.issuing_org;
    var issuing_date =  req.body.issuing_date;
    var expiration_date = req.body.expiration_date;
    var user_id = req.body.user_id || req.query.user_id;
    var seq = req.params.seq;

    var sql = 'update tests set test_name=?, score=?, issuing_org=?, issuing_date=?, expiration_date=?, user_id=? where seq=?';
    conn.query(sql, [test_name, score, issuing_org, issuing_date, expiration_date, user_id, seq], (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send("internal server error");
        } else {
            res.redirect('/test/' + seq);
        }
    });
});


// 5-4. test 게시글 삭제
app.get('/test/:seq/delete', (req, res) => {
    var sql = 'select seq, test_name from tests';
    var seq = req.params.seq;

    conn.query(sql, (err, posts, fields) => {
        var sql = 'select * from tests where seq=?';
        conn.query(sql, [seq], (err, posts) => {
            if(err) {
                console.log(err);
                res.status(500).send('internal server error1');
            } else {
                if(posts.length === 0) {
                    console.log('레코드가 없어용');
                    res.status(500).send('internal server error2');
                } else {
                    res.render('test/test_delete', {posts:posts, post:posts[0]});
                }
            }
        });
    });
});

// 글 삭제 - yes 버튼을 눌렀을 때 정말 삭제
app.post('/test/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from tests where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/test');
    });
});

//--------------- 5. test 끝 ----------------------------------------------

//----------------- 6. career 게시판 ----------------------------------------------

// 6-1. career 게시판 글 생성
app.get('/career/add', (req, res) => {
    var sql = 'select * from career';
    conn.query(sql, (err, posts, fields) => {
        if(err){
            console.log(err);
        } 
        res.render('car/car_add', {posts:posts});
    });
});

app.post('/career/add', (req, res) => {
    var org_name = req.body.org_name;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var career_description = req.body.career_description;
    var user_id = req.body.user_id || req.query.user_id;
    var sql = 'insert into career(org_name, start_date, end_date, career_description, user_id) values(?, ?, ?, ?, ?)';
    conn.query(sql, [org_name, start_date, end_date, career_description, user_id], (err, result, fields)=> {
        if(err){
            console.log(err);
            console.log("데이터 추가 에러");
            res.status(500).send("internal server error");
        } else {
            res.redirect('/career');
        }
    });
});

// 6-2. career 게시판 글목록 보기, 글 상세보기
app.get(['/career', '/career/:seq'],(req, res) => {
    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    }
else{  // 로그인 한 상태만 접근가능
    var user_id = sess.user_id;  // 이걸로 내 아이디로 작성한 글만 판별해서 보여줄것임
    var sql = 'SELECT * FROM career where user_id=?';  
        conn.query(sql, [user_id], (err, posts, fields) => {
            var seq = req.params.seq || req.query.seq;
            // 만약 career/:id 로 들어왔다면 (글 상세보기)
            if(seq) {
                var sql = 'SELECT * FROM career WHERE seq=?'; 
                conn.query(sql, [seq], (err, posts, fields) => {
                    if(err){ // 에러가 있으면
                        console.log(err);
                    } else { // 에러가 없으면
                        res.render('car/car_detail', {posts:posts, post:posts[0]})
                    }

                })
            } else{
                //res.send(posts);
                res.render('car/career', {posts:posts});
            }
        });
    }

});


// 6-3. career 게시글 수정
app.get(['/career/:seq/edit'], (req, res) => {
    var sql = 'select * from career';
    conn.query(sql, (err, posts, fields) => {
        var seq = req.params.seq;
        if(seq) {
            var sql = 'select * from career where seq=?';
            conn.query(sql, [seq], (err, posts, fileds) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.render('car/car_edit', {posts:posts, post:posts[0]});
                }
            });
        } else {
            console.log('there is no id');
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post(['/career/:seq/edit'], (req, res) => {
    
    var org_name = req.body.org_name;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var career_description = req.body.career_description;
    var user_id = req.body.user_id || req.query.user_id;
    var seq = req.params.seq;

    var sql = 'update career set org_name=?, start_date=?, end_date=?, career_description=?, user_id=? where seq=?';
    conn.query(sql, [org_name, start_date, end_date, career_description, user_id, seq], (err, posts, fields) => {
        if(err){
            console.log(err);
            res.status(500).send("internal server error");
        } else {
            res.redirect('/career/' + seq);
        }
    });
});


// 6-4. career 게시글 삭제
app.get('/career/:seq/delete', (req, res) => {
    var sql = 'select seq, org_name from career';
    var seq = req.params.seq;

    conn.query(sql, (err, posts, fields) => {
        var sql = 'select * from career where seq=?';
        conn.query(sql, [seq], (err, posts) => {
            if(err) {
                console.log(err);
                res.status(500).send('internal server error1');
            } else {
                if(posts.length === 0) {
                    console.log('레코드가 없어용');
                    res.status(500).send('internal server error2');
                } else {
                    res.render('car/car_delete', {posts:posts, post:posts[0]});
                }
            }
        });
    });
});

// 글 삭제 - yes 버튼을 눌렀을 때 정말 삭제
app.post('/career/:seq/delete', (req, res) => {
    var seq = req.params.seq;
    var sql = 'delete from career where seq=?';
    conn.query(sql, [seq], (err, result) => {
        res.redirect('/career');
    });
});

//--------------- 6. career 끝 ----------------------------------------------

//서버 열기
app.listen(3000, (req, res) => {
    console.log("server start at port 3000");
});

