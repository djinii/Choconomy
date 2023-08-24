const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); 
const server = http.createServer(app);
const io = socketIo(server);
const redisClient = new Redis();
const port = 3000;

const mongoose = require('mongoose');
const {collection, quizzes, sel_quizzes} = require('./mongodb');

const dotenv = require('dotenv');
dotenv.config();
const db = process.env.MONGODB;

mongoose.connect(db)
  .then(() => {
      console.log('mongodb connected')
  })
  .catch(() => {
      console.log('failed to connect')
  }) 


app.use(cookieParser());
app.use(session({ secret: '13egin', resave: false, saveUninitialized: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/join.html'));
  res.cookie('name', 'value', { httpOnly: true });
});
app.get('/main', (req, res) => {
  const nickname = req.session.nickname;
  res.sendFile(path.join(__dirname + '/public/main.html'));
});


const jobList = ['dr', 'banker', 'po'];
redisClient.sadd('job_list', ...jobList);


app.post('/saveData', async function (req, res) {
  let nickname = req.body.nickname;
  const checkname = await checkDB(nickname);
  if (checkname) {
      res.json({ success: false });
  } 
  else {

    const random_job = await RandomJob()
    const userinfo = {
      money: 180000, //잔액
      name: nickname,
      time: 1800, //게임시간 1800
      health: 500, //체력
      level: 1, //직위
      score: 0, // 총 자산
      interruption: 0, //중단지점 점수
      insurance: 0,  
      savings: 0,
      disease: 0,
      ability: 100, //능력
      housing: 0, //집
      loan: 0, //대출
      limit: 10000, //한도
      job: random_job,
      alive: 1
    };
    const user_status = {
        name : nickname,
        game: 0,
        ready : 0
    }
    userinfo.score = userinfo.money + userinfo.savings - userinfo.loan
    req.session.nickname = nickname;
    res.cookie('nickname', nickname, { httpOnly: false })
    redisClient.set(nickname, JSON.stringify(userinfo));
    collection.insertMany([user_status])
    res.json({ success: true });
  }
});

app.post('/updateReady', async (req, res) => {
  const nickname = req.body.nickname;
  const readyStatus = req.body.ready;

  try {
      await collection.updateOne({ name: nickname }, { $set: { ready: readyStatus } });
      res.json({ success: true });
      allReady();
  }
  catch (error) {
      console.error(error);
      res.json({ success: false });
  }
});

app.post('/atHome', (req, res)=>{
  const nickname = req.cookies.nickname;
  const time = req.body.health;

  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'An error occurred during shop payment' });
      return;
    }else {
      let userinfo = JSON.parse(reply);
      if(userinfo.housing === 0){
        res.send({msg : '집이 없음'});
      }else{
        console.log('휴식. 체력 +1000?')
        userinfo.health += 1000;
        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);
        res.send({ health: userinfo.health});
      }  
  }
  })
})
//mart, estate
app.post('/update', function(req, res) {
  const action = req.body.action;
  const nickname = req.cookies.nickname;

  redisClient.get(nickname, function (err, reply) {
    if (err) {
      res.status(500).json({ success: false, message: err });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);
      if(action === 'eating'){
        sendMsg(userinfo,{health: 10, money: -55},'결제가 완료되었습니다.');
      }else if(action === 'drinking'){
        sendMsg(userinfo,{health: 10, money: -55},'결제가 완료되었습니다.');
      }
      else if(action === 'reading'){
        sendMsg(userinfo, {ability: 5, money: -50}, '결제가 롼료되었습니다.');
      }
      else if(action === 'insurance_1'){
        console.log(userinfo.insurance)
        if(userinfo.insurance === 95){
          sendMsg(userinfo,{ability:0, money:0}, '이미 가입했습니다.');
        }
        else if (userinfo.insurance === 0){
          sendMsg(userinfo,{insurance:95, money: -20}, '가입완료 되었습니다.');
        }
        else{
          sendMsg(userinfo,{insurance:30, money: -10}, '고가형으로 전환되었습니다');
        }
      }
      else if(action === 'insurance_2'){
        if(userinfo.insurance != 0){
          sendMsg(userinfo,{ability:0, money:0},'이미 가입했습니다.')
        }else{
          sendMsg(userinfo,{insurance: 65, money:-30}, '가입 완료 되었습니다.');
        }
      }
      else if(action === 'selling_room'){
        if(userinfo.housing === 0){
          sendMsg(userinfo,{insurance: 0, money:0},'보유하고 있는 집이 없습니다.');
        }
        else{
          sendMsg(userinfo,{money: 50000, housing: -40000},'판매완료');
        }
      }
      else if(action === 'buying_room'){
        if(userinfo.housing === 0){
          sendMsg(userinfo, {housing:40000, money: -40000}, '구매완료')
        }else{
          sendMsg(userinfo, {money:0}, '이미 보유하고 있습니다.')
        }
      }

        function sendMsg(userinfo, update, msg) {
          for (const key in update){
            userinfo[key] += update[key];
          }
          const updatedValue = JSON.stringify(userinfo);
          redisClient.set(nickname, updatedValue);
          res.send({msg})
        }
      }
    });
  });

//bank
app.post('/savings', function(req, res) {
  const nickname = req.cookies.nickname;
  const save_amount = parseInt(req.body.saveAmount);
  
  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: err });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);
      if (userinfo.money >= save_amount) {
        userinfo.money -= save_amount;
        userinfo.savings += (save_amount + 3);

        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);
        
        res.send({ money: userinfo.money, savings: userinfo.savings, msg:'입금완료 되었습니다.' });
      }
      else {
        res.send({msg: '잔액이 부족합니다.'})
      }
    }
  });
});
app.post('/withdraw', function(req, res) {
  const nickname = req.cookies.nickname;
  const withdraw_amount = parseInt(req.body.withdrawAmount);

  redisClient.get(nickname, function(err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: err });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);

      if (withdraw_amount <= userinfo.savings) {
        userinfo.savings -= withdraw_amount;
        userinfo.money += withdraw_amount;

        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);

        res.send({ money: userinfo.money, savings: userinfo.savings,msg:'정상 출급되었습니다' });
      }
      else {
        res.send({msg:'잔액이 부족합니다.'})
      }
    }
  })
})

// 대출
app.post('/get_loan', function(req, res) {
  const nickname = req.cookies.nickname;
  const loan_amount = parseInt(req.body.loanAmount);

  redisClient.get(nickname, function (err, reply) { 
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: err });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);  

      if (loan_amount <= userinfo.limit) {
        userinfo.loan += loan_amount;  
        userinfo.limit -= loan_amount;  

        redisClient.set(nickname, JSON.stringify(userinfo));
        
        res.send({ loan: userinfo.loan, limit: userinfo.limit, msg:'대출 완료되었습니다.' });
      }
      else {
        res.send({msg:'대출 한도를 초과했습니다.'})
      }
    }
  });
});

// 상환
app.post('/repay', function(req, res) {
  const nickname = req.cookies.nickname;
  const repay_amount = parseInt(req.body.repayLoan);

  redisClient.get(nickname, function (err, reply) {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: err });
      return;
    }
    else {
      let userinfo = JSON.parse(reply);
    
      if (repay_amount <= userinfo.loan) { 
        userinfo.money -= repay_amount;
        userinfo.loan -= repay_amount;
        userinfo.limit += repay_amount;  

        const updatedValue = JSON.stringify(userinfo);
        redisClient.set(nickname, updatedValue);

        res.send({ money: userinfo.money, loan: userinfo.loan, msg:"정상 처리 되었습니다." })
      }
      else {
        res.send({msg : "잔여 대출금이 상환금액보다 적습니다"})
      }
    }
  });
});

async function allReady(){
  const total_player = await collection.countDocuments({});
  const ready_player = await collection.countDocuments({ready : 1});
  
    if(total_player === ready_player){
      setTimeout(()=>{
          io.emit('all-ready');
      },3000);
      console.log(total_player)
      console.log(ready_player)
    return 
  }
  else {
    return setInterval(allReady, 3000);
  }
}

function checkDB(nickname) {
  return new Promise((resolve) => {
      redisClient.exists(nickname, (err, result) => {
      if (err) {
          console.error(err);
          resolve(false);
      }
      resolve(result === 1);
      });
  });
}

function RandomJob() {
  return new Promise((resolve) => {
      redisClient.srandmember('job_list', (err, random_job) => {
      if (err) {
          console.error(err);
          resolve(null);
      }
      resolve(random_job);
      });
  });
}

app.get('/getData', async(req, res) => {
  const nickname = req.cookies.nickname; 
  redisClient.get(nickname, (err, reply) => {
    if (err) {
      console.log(err);
    }
    else {
      let userinfo = JSON.parse(reply);
      res.send(userinfo);
    }
  })
})


let players = {}; 
let avatars = [
  {name: 'AVA1', src: './assets/ava/AVA1.png'},
  {name: 'AVA2', src: './assets/ava/AVA2.png'},
  {name: 'AVA3', src: './assets/ava/AVA3.png'},
  {name: 'AVA4', src: './assets/ava/AVA4.png'},
  {name: 'AVA5', src: './assets/ava/AVA5.png'},
  {name: 'AVA6', src: './assets/ava/AVA6.png'},
  {name: 'AVA7', src: './assets/ava/AVA7.png'},
  {name: 'AVA8', src: './assets/ava/AVA8.png'},
  {name: 'AVA9', src: './assets/ava/AVA9.png'},
  {name: 'AVA10', src: './assets/ava/AVA10.png'},
];

let playerName = null;


io.on('connection', (socket)=> {
  console.log(`user connected: ${socket.id}`);

  const randomIndex = Math.floor(Math.random() * avatars.length);
  const avatar = avatars[randomIndex];
  avatars.splice(randomIndex, 1);  // 아바타 사용 완료 후 해당 아바타는 배열 avatars에서 제거
  
  players[socket.id] = {
    x: 520,
    y: 350,
    playerId: socket.id,
    playerName: playerName,
    avatar: avatar,
  };
    
    console.log(players[socket.id])
  
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);  

    socket.on('disconnect', () =>{
      console.log('user disconnected');
      avatars.push(players[socket.id].avatar) // 사용한 아바타 다시 추가
      delete players[socket.id];
      io.emit('gameDisconnect', socket.id);
    });

    // 플레이어 움직임
    socket.on('playerMovement', function (movementData) { 
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        socket.broadcast.emit('playerMoved', players[socket.id]); 
    });

    socket.on('chatting', (data) => {
      console.log('test:', data);
      const { name, msg } = data;
      io.emit('chatting', { name: name,  msg: msg});
    });

    socket.on('sendData', (data) => 
    {
      redisClient.get(data, (err, reply) => 
      {
        let name = data
        if (err) 
        {
          console.log(err)
        }
        else 
        {
          let time = 180;  // 1800
          let userinfo = JSON.parse(reply);
          function update_value() 
          {
            time--;
            // 시간 초과에 의한 게임 종료
            if (time <= -1) {
              console.log('게임 시간이 종료되었습니다.');
              userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;
             userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;

              socket.emit('game_finish', { name: name, score: userinfo.score })
              console.log('최종 점수:', userinfo.score);
              clearInterval(intervalId);
              return;
            } else if (userinfo.money <= 0) {
              userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;
              socket.emit('game_finish_money', { name: name, score: userinfo.score });
              console.log('파산. 최종 점수:', userinfo.score);
              clearInterval(intervalId);
              return;
            } else if (userinfo.health <= 0) {
              userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;
              socket.emit('game_finish_health', { name: name, score: userinfo.score });
              console.log('최종 점수:', userinfo.score);
              clearInterval(intervalId);
              return;
            } else {
               // 첫 5분동안은..
               if (time > 1780)
               {  
                 userinfo.money -= 200;  // 1분당 200원 감소  userinfo.money -= 200;
                 userinfo.health -= 1;  // 1분당 0.2 감소  userinfo.health -= 0.2;
                 userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;
               }
                // 5분 후 집이 사라지면
                else {  
                  userinfo.money -= 300;  // 1분당 300원 감소  userinfo.money -= 300;
                  userinfo.health -= 0.4;  // 1분당 0.4 감소  userinfo.health -= 0.4;
                  userinfo.score = userinfo.money + userinfo.savings - userinfo.loan;
                }
                const min = ~~(time / 60);
                const sec = time % 60
                const timeFormat = `${min}:${sec < 10 ? '0': ''}${sec}`;
                socket.emit('time', timeFormat)
                playerName = name;  // 플레이어 닉넴 획득
                socket.emit('money', userinfo.money)
                socket.emit('health', userinfo.health.toFixed(2))
                socket.emit('userinfo', userinfo);
                redisClient.set(name, JSON.stringify(userinfo));
              }
            }
          const intervalId = setInterval(() => 
          {
            redisClient.get(name, (err, reply) => 
            {
              if (!err) 
              {
                userinfo = JSON.parse(reply);
                update_value();
              }
            });
          }, 1000); 
      
 
      }
    });
  });
})

app.post('/findBQ1', async (req, res) => {
  const bank = req.body.bank;
  try {
    const b_quiz = await quizzes.findOne({ tag: bank });

    if (b_quiz){
      const bq= b_quiz.q;
      const ba = b_quiz.a;
      const bpoint = b_quiz.point;

      res.json({ success: true, bq, ba, bpoint });
    } else {
      res.json({success:false, message: '은행OX를 찾지 못했습니다.'})
    }
  }
  catch (error) {
      console.error(error);
      res.json({ success: false });
  }
});

app.post('/findPQ1', async (req, res) => {
  const police = req.body.police;
  try {
    const p_quiz = await quizzes.findOne({ tag: police });

    if (p_quiz){
      const pq= p_quiz.q;
      const pa = p_quiz.a;
      const ppoint = p_quiz.point;

      res.json({ success: true, pq, pa, ppoint });
    } else {
      res.json({success:false, message: '경찰OX를 찾지 못했습니다.'})
    }
  }
  catch (error) {
      console.error(error);
      res.json({ success: false });
  }
});

app.post('/findCQ1', async (req, res) => {
  const clinic = req.body.clinic;
  try {
    const c_quiz = await quizzes.findOne({ tag: clinic });

    if (c_quiz){
      const cq= c_quiz.q;
      const ca = c_quiz.a;
      const cpoint = c_quiz.point;

      res.json({ success: true, cq, ca, cpoint });
    } else {
      res.json({success:false, message: '병원OX를 찾지 못했습니다.'})
    }
  }
  catch (error) {
      console.error(error);
      res.json({ success: false });
  }
});

server.listen(3000, function () {
  console.log(`Listening on ${server.address().port}`);
})
