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
    console.log(sess);
    res.render('main'); //세션에 
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

router.get('/resume/:resume_seq', (req, res) => {
    //sess = req.session;
    //console.log(sess);
    res.render('resume/resume'); //세션에 
});

// router.get('/search', function(req, res){
//     sess = req.session;
//     var searchKey = req.body.searchKey;
    
//     //if(!searchKey) return res.redirect('/main');
//     res.render('../views/search')
// });


// search


// 다른 6가지 게시판 라우터 여기다가 하기

module.exports = router; // 모듈로 만드는 부분