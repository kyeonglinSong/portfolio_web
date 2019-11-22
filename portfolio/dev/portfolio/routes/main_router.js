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
        let tables = [
            'career', 'certifications', 'projects', 'resume', 'tests', 'competitions'
        ];
        let sql = "select * from users where user_id=?"
        
        let sql3 = "SELECT SUM(awards_check) as sum FROM competitions WHERE user_id=? and awards_check=1 GROUP BY awards_check;"
        //res.render('main', {user_id:sess.user_id, post:post[0], counts:counts});
        apps.conn.query(sql, [sess.user_id], (err, post) => {
            if(err){
                console.log(err);
                res.status(500).send("internal server error");
            } else {
                var i=0;
                let cnt = 0;
                let counts = []
                for(i=0; i<tables.length; i++){
                    let sql2 = "SELECT COUNT(*) as count FROM "+tables[i]+ " WHERE user_id=?";
                    apps.conn.query(sql2, [sess.user_id], (err, count) => {
                        if(err){
                            console.log(err);
                            res.status(500).send("internal server error");
                        }
                        console.log(count);
                        cnt++;
                        counts.push(count[0]);
                        console.log(cnt)
                        if(cnt===5){
                            apps.conn.query(sql3, [sess.user_id], (err, comp_counts)=> {
                                if(err){
                                    console.log(err);
                                    return res.status(500).send("internal server error");
                                }
                                else {
                                    //if(!comp_counts) comp_counts = [{'sum':0}];
                                    console.log(comp_counts);
                                    return res.render('main', {user_id:sess.user_id, post:post[0], tables:tables, counts:counts, comp_counts:comp_counts});
                                }
                            });
                        }
                    })
                }
            }
        });
        


    }
});

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

module.exports = router; // 모듈로 만드는 부분