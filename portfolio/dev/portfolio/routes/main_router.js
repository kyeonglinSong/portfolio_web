const express = require('express');
const path = require('path');
const router = express.Router(); // 라우터 분리
const search_results = require('../app');


// main
router.post('/', function(req, res){
    sess = req.session;
});

router.get('/', (req, res) => {

    sess = req.session;

    if(!sess.logined) // 로그인 안 된 상태라면 접근안됨
    {
        res.send(`
        <h1>Who are you?</h1>
        <a href="/">Back </a>
      `);
    
    } else {  // 로그인 한 상태만 접근가능
    console.log(sess);
    res.render('main');

    }
});

router.post('/search', function(req, res){
    sess = req.session;
    //console.log(req);
    var results = [];
    var searchKey = req.body.searchKey;

    //console.log(searchKey);

    resumeDict = search_results.resume_res;

    //console.log(resumeDict[0]);
    for(var i = 0; i<resumeDict.length; i++ ){
        for(var key in resumeDict[i]){
            if(key == 'seq') continue;
            // console.log(typeof searchKey);
            // console.log(typeof resumeDict[i][key]);
            if(resumeDict[i][key].includes(searchKey)){
                results.push(resumeDict[i]);
                break;
            }
        }
    }
    //console.log(results);

    res.render('../views/search', {results:results});

});

/*
router.get('/resume/:resume_seq', (req, res) => {
    //sess = req.session;
    //console.log(sess);
    res.render('resume/resume'); //세션에 
});
*/

// router.get('/search', function(req, res){
//     sess = req.session;
//     var searchKey = req.body.searchKey;
    
//     //if(!searchKey) return res.redirect('/main');
//     res.render('../views/search')
// });


// search

// 게시판 라우트정보


module.exports = router; // 모듈로 만드는 부분