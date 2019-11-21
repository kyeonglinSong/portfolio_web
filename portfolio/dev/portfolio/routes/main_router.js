const express = require('express');
const path = require('path');
const str_query = require('./database/all_query');
const router = express.Router(); // 라우터 분리
const apps = require('../app');


// main
router.post('/', function(req, res){
    sess = req.session;
});

router.get('/', (req, res) => {

    sess = req.session;
    console.log(sess);

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <div style="text-align: center;">
        <h1>Who are you?</h1>
        <a href="/">Back </a>
        </div>
      `);
    
    } else {  // 로그인 한 상태만 접근가능
        let sql = "select * from users where user_id=?"
        apps.conn.query(sql, [sess.user_id], (err, post) => {
            //console.log("NEW!")
            //console.log(post)
            res.render('main', {user_id:sess.user_id, post:post[0]});
        });
        
        //console.log(sess);
    // res.render('main', {user_id:sess.user_id, post: post});

    }
});

// router.get('/search', function(req, res){
//     sess = req.session;
    
//     //if(!searchKey) return res.redirect('/main');
//     res.render('../views/search')
// });

router.post('/search', function(req, res){
    sess = req.session;
    console.log(req.body);
    var results = [];
    var searchBoard = req.body.searchBoard;
    console.log(typeof select)
    var searchKey = req.body.searchKey;

    console.log("search key : "+searchKey);

    //let results = [];
    let sql = "SELECT * FROM "+searchBoard+" WHERE user_id=?;"
    console.log(sql);
    
    apps.conn.query(sql, [sess.user_id], function(err, post, fields)
    {
        if (err)  return console.log(err);

        let ok = false;

        console.log(post);

        for(var i = 0; i<post.length; i++ ){
            //console.log(p);
            for(var key in post[i]){
                if(typeof post[i][key] !== 'string') continue;
                console.log(post[i][key])
                if(post[i][key].includes(searchKey)){
                    results.push(post[i]);
                    ok = true;
                    break;
                }
            }
        }
        console.log(results);
        // if(post.length)
        // {
        //     for(var i = 0; i<post.length; i++ )
        //     {
        //         //console.log(res[i]);
        //         resumeDict[resumeDict.length] = {
        //             'seq' : post[i]['seq'],
        //             'company' : post[i]['company'],
        //             'text': post[i]['text']
        //         };
        //     }
        // }
        // let ok = false;
        // console.log(resumeDict);
        // for(var i = 0; i<resumeDict.length; i++ ){
        //     for(var key in resumeDict[i]){
        //         if(key == 'seq') continue;
        //         if(resumeDict[i][key].includes(searchKey)){
        //             results.push(resumeDict[i]);
        //             ok = true;
        //             break;
        //         }
        //     }
        // }
        // console.log(results);
        if(!ok) {
            return res.send(`
              <div style="text-align: center;">
              <h1>Nothing..</h1>
              <a href="/">Back</a>
              </div>
            `);
        }
        return res.render('../views/search', {results:results});
    });
});

router.get('/resume', (req, res) => {
    //sess = req.session;
    //console.log(sess);
    res.render('resume/resume'); //세션에 
});

router.post('/:user_id/deleteAcount', (req, res) => {
    sess = req.session;
    console.log(sess);
    user_id = sess.user_id;

    var sql = 'delete from users where user_id=?';
    apps.conn.query(sql, [user_id], (err, result) => {
        res.redirect('/logout');
    });
});

router.get('/:user_id/deleteAcount', (req, res) => {
    sess = req.session;
    console.log(sess);
    res.render('login/deleteAcount', {user_id:sess.user_id}); //세션에 
});

router.post('/:user_id/edit', (req, res) => {
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
    apps.conn.query(sql, userinfo, (err, result) => {
        console.log(result);
        return res.send(`
        <div style="text-align: center;">
        <h1>Edit Successfully</h1>
        <a href="/">Back</a>
        </div>
        `);
    });
});

router.get('/:user_id/edit', (req, res) => {
    sess = req.session;
    console.log(sess);
    let sql = "select * from users where user_id=?"
    apps.conn.query(sql, [sess.user_id], (err, post) => {
        console.log("EDIT!")
        console.log(post)
        res.render('login/mypage_edit', {user_id:sess.user_id, post:post[0]});
    });
});

// search

// 게시판 라우트정보


module.exports = router; // 모듈로 만드는 부분