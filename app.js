// lsof -i -P | grep -i "listen" 
// ssh pi@eubnara.gonetis.com
// 비밀번호: duddls)@!^dbql

var http = require('http');
var fs = require('fs');
var firebase = require('firebase');

var firebaseConfig = {
    apiKey: "AIzaSyAbEFFJ93FsoXSXdjkBXMYGqRjb3ojnGec",
    authDomain: "corocoro-5302f.firebaseapp.com",
    databaseURL: "https://corocoro-5302f.firebaseio.com",
    projectId: "corocoro-5302f",
    storageBucket: "corocoro-5302f.appspot.com",
    messagingSenderId: "941393088324",
    appId: "1:941393088324:web:5afc947bf2c4aa8f59d111",
    measurementId: "G-294LF9PFW0"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 국가코드 추출
var nations = fs.readFileSync('countries_en.txt', 'utf8');
const json = JSON.parse(nations);
var ret = {};
for(var key in json){
  ret[json[key]] = key;
}

function upper(x) {
  return x.charAt(0).toUpperCase() + x.slice(1);}

// nodejs cron
http.createServer(function (req, res) {
  // html get 부분
  var exec = require('child_process').exec,
  child;
  child = exec("curl https://coronaboard.kr/en/ > dashboard.html", function (error, stdout, stderr) {
    // 파싱 부분
    var html = fs.readFileSync('dashboard.html', 'utf8');
    let list = html.split("var jsonData = ")[1];
    list = list.split(";</script><script src")[0];
    list = list.split("[")[1];
    list = list.split("]")[0];
    list = '{"data":[' + list + "]}"; 
    const obj = JSON.parse(list);
    obj.data.sort(function (a, b) {
      if (a.confirmed < b.confirmed) {
        return 1;
      }
      if (a.confirmed > b.confirmed) {
        return -1;
      }
      return 0;
    });
    
    // db add 부분  
    var total = {
      cc: 'total',
      updatedAt: new Date(),
      nation: 'total',
      number: 0,
      confirmed: 0,
      death: 0,
      released: 0,
      candidate: 0,
      negative: 0,
      tested: 0,
      active: 0,
      confirmed_prev: 0,
      death_prev: 0,
      candidate_prev: 0,
      negative_prev: 0,
      released_prev: 0,
      active_prev: 0,
      population: 0,
      incidence: 0,
      flag: '',
      arr: obj.data.slice(0, 100),
    };
    for (let i=0; i<obj.data.length; i++) {
      var element = obj.data[i];
      element.nation = ret[element.cc.toString()] ? upper(ret[element.cc.toString()]) : 'Diamond Princess';
      element.number = i+1;

      db.collection('cc').doc(element.cc.toString()).set({
        cc: element.cc.toString(),
        nation: ret[element.cc.toString()] ? ret[element.cc.toString()] : '',
        number: i,
        confirmed: element.confirmed,
        death: element.death,
        released: element.released,
        candidate: element.candidate,
        negative: element.negative,
        tested: element.tested,
        active: element.active,
        confirmed_prev: element.confirmed_prev,
        death_prev: element.death_prev,
        candidate_prev: element.candidate_prev,
        negative_prev: element.negative_prev,
        released_prev: element.released_prev,
        active_prev: element.active_prev,
        population: element.population,
        incidence: element.incidence,
        flag: element.flag
      });

      total.confirmed+=element.confirmed?element.confirmed:0;
      total.death+=element.death?element.death:0;
      total.released+=element.released?element.released:0;
      total.candidate+=element.candidate?element.candidate:0;
      total.negative+=element.negative?element.negative:0;
      total.tested+=element.tested?element.tested:0;
      total.active+=element.active?element.active:0;
      total.confirmed_prev+=element.confirmed_prev?element.confirmed_prev:0;
      total.death_prev+=element.death_prev?element.death_prev:0;
      total.candidate_prev+=element.candidate_prev?element.candidate_prev:0;
      total.negative_prev+=element.negative_prev?element.negative_prev:0;
      total.released_prev+=element.released_prev?element.released_prev:0;
      total.active_prev+=element.active_prev?element.active_prev:0;
      total.population+=element.population?element.population:0;
      total.incidence+=element.incidence?element.incidence:0;
    }
    // total.confirmed = numberWithCommas(total.confirmed)
    db.collection('dashboard').doc('total').set(total)
    db.collection('dashboard').doc('total2').set({arr: obj.data.slice(101, obj.data.length)})

    // 응답 부분
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(ret.toString());
  });

}).listen(8080);

var cron = require('node-cron');
// second minute hour day-of-month month day-of-week
cron.schedule('0 * * * *', function(){
  console.log('node-cron 실행 테스트');
  var exec = require('child_process').exec,
  child;
  child = exec("curl localhost:8080", function (error, stdout, stderr) {})
});
