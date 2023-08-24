
let config = {
  type: Phaser.AUTO,
  parent: 'mainGame',
  width: 1280, 
  height: 800,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  } 
};

let keyboard = {
  enabled: true
};


const time_elem = document.getElementById('time');
const health_elem = document.getElementById('health');
const money_elem = document.getElementById('money');
const LoanNumTxt = document.getElementById('user_loan');
const MoneyNumTxt = document.getElementById('user_money');
const BankUsername = document.getElementById('user_name');
const level_elem = document.getElementById('level');
const ability_elem = document.getElementById('ability');
const loan_limit = document.getElementById('loan_limit');
const mp_name = document.getElementById('mypage_name');
const mp_housing = document.getElementById('mypage_housing')
const mp_job = document.getElementById('mypage_job')
const mp_saving = document.getElementById('mypage_saving');
const mp_limit = document.getElementById('mypage_limit');
const mp_loan = document.getElementById('mypage_loan');
const r_money = document.getElementById('r_money');
const r_savings = document.getElementById('r_savings');
const r_housing = document.getElementById('r_housing');
const r_hp = document.getElementById('r_hp');
const r_int = document.getElementById('r_int');
const r_loan = document.getElementById('r_loan');
const r_score = document.getElementById('r_score');

let game = new Phaser.Game(config);
let map;
let cursors;
const final = document.getElementById('final')

function preload(){
  this.load.image('labeled', './assets/map/label.png',);
  this.load.image('tileset', './assets/map/new_tileset.png',);
  this.load.tilemapTiledJSON('map',"./assets/map/new.json");
  this.load.spritesheet('AVA1', './assets/ava/AVA1.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA2', './assets/ava/AVA2.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA3', './assets/ava/AVA3.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA4', './assets/ava/AVA4.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA5', './assets/ava/AVA5.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA6', './assets/ava/AVA6.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA7', './assets/ava/AVA7.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA8', './assets/ava/AVA8.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA9', './assets/ava/AVA9.png', {frameWidth:32, frameHeight:64});
  this.load.spritesheet('AVA10', './assets/ava/AVA10.png', {frameWidth:32, frameHeight:64});
}

function create() {
let self = this;
this.socket = io();

this.otherPlayers = this.physics.add.group(); 
this.socket.emit('sendData', name);
console.log(name)
this.socket.emit('nickname', name);
this.socket.on('receiveData', function(data){
  console.log(data)
})

const map = this.make.tilemap({ key: 'map'});
const tileset = map.addTilesetImage('new_tileset', 'tileset') ; //타일셋이미지명, preload에서 지정한 key값
const tilesLayer = map.createLayer('tiles', tileset);
const collision = map.createLayer('collision', tileset);

//배경 이미지를 게임 화면 크기로 확대
const backgroundImage = this.add.image(0, 0, 'labeled');
backgroundImage.setOrigin(0, 0); // 이미지의 원점을 좌상단으로 설정
backgroundImage.setScale(this.scale.width / backgroundImage.width, this.scale.height / backgroundImage.height);

//충돌
collision.setCollisionByProperty({collision: true});
collision.setCollisionByExclusion([715]);
this.collision = collision

this.socket.on('currentPlayers', function (players) {
  Object.keys(players).forEach(function (id) {
    if (players[id].playerId === self.socket.id) {
      addPlayer(self, players[id], collision);
    } else {
      addOtherPlayers(self, players[id], collision);
    }
    
  });
});


this.socket.on('newPlayer', function (playerInfo) {
  addOtherPlayers(self, playerInfo, collision);
});

this.socket.on('gameDisconnect', function (playerId) {  
  self.otherPlayers.getChildren().forEach(function (player) {  
    if (playerId === player.playerId) {
      player.destroy(); 
    }
  });
});

this.socket.on('playerMoved', function (playerInfo) {
  self.otherPlayers.getChildren().forEach(function (otherPlayer) {
    if (playerInfo.playerId === otherPlayer.playerId) {
      otherPlayer.setPosition(playerInfo.x, playerInfo.y);
    }
  });
});
this.socket.on('userinfo',(data)=>{
  LoanNumTxt.textContent = `${data.loan}`
  MoneyNumTxt.textContent = `${data.savings}`
  BankUsername.textContent = `${data.name} 님`
  money_elem.textContent = `${data.money}`
  level_elem.textContent = `${data.level}`
  ability_elem.textContent = `${data.ability}`
  loan_limit.textContent = `한도: ${data.limit}`
  // 마이페이지
  mp_name.textContent = `${data.name}님`
  mp_housing.textContent = `  ₩ ${data.housing}`
  mp_job.textContent = `${data.job}`
  mp_saving.textContent = `  ₩ ${data.savings}`
  mp_limit.textContent = `  ₩ ${data.limit}`
  mp_loan.textContent = `  ₩ ${data.loan}`
  // 게임결과모달
  r_money.textContent = `${data.money}`
  r_savings.textContent = `${data.savings}`
  r_housing.textContent = `${data.housing}`
  r_int.textContent = `${data.ability}`
  r_loan.textContent = `${-data.loan}`
  r_score.textContent = `${data.score}`


})

this.socket.on('time', (time)=>{
  time_elem.textContent = `${time}`
})
this.socket.on('health',(health)=>{
  health_elem.textContent = `${health}`
  r_hp.textContent = `${health}`
})

this.socket.on('game_finish', (data) =>{
  const { name, score } = data;
  final.style.display = "block";
  result.style.display = "block";
})

this.socket.on('game_finish_money',(data)=>{
  const { name, score } = data;
  final.style.display = "block";
  result.style.display = "block";
})

this.socket.on('game_finish_health', (data)=>{
  const { name, score } = data;
  final.style.display = "block";
  result.style.display = "block";
})

///채팅 기능
const nickname = document.querySelector('#nick-name')
const egList = document.querySelector(".EgList");  // 채팅 내용
const chatInput = document.getElementById("chatInput");  // 메시지
const sendButton = document.getElementById("chatBtn");  // 전송
const chatList = document.querySelector(".ChatList")  // 화면 내용

chatInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
      event.preventDefault();
      sendButton.click();
      chatInput.value = '';
  }
});

sendButton.addEventListener("click", () => {  // 버튼을 클릭해서 param 내용(사용자명, 메시지) 전송
    const param = { name: nickname.textContent, msg: chatInput.value }
    this.socket.emit("chatting", param);
    chatInput.value = '';
})
this.socket.on('chatting', (data) => {
    const { name, msg} = data;  // 사용자명, 메세지, 보낸 시간
    const item = new LiModel(name, msg);  // LiModel을 인스턴스 화
    item.makeLi();
    chatList.scrollTo(0, chatList.scrollHeight);
});
function LiModel(name, msg) {
    this.name = name;
    this.msg = msg;
    this.makeLi = () => {
        const ul = document.createElement("ul");
        const dom = `
        <span class="profile">
            <span class="user" style="color: black; font-size: 30px; font-family: 'Cafe24Supermagic-Bold-v1.0'; font-weight: 500; word-wrap: break-word;">${this.name} :  </span>
        </span>
        <span class="message" style="color: black; font-size: 30px;font-family: 'Cafe24Supermagic-Bold-v1.0'; font-weight: 500; word-wrap: break-word;">${this.msg}</span>
        
        `;
        ul.innerHTML = dom;
        egList.appendChild(ul);
    }
}

this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {

  this.cursors = this.input.keyboard.createCursorKeys();
  const speed = 180;
  let playerVelocity = new Phaser.Math.Vector2();

  if (this.player) {
    if (this.cursors.left.isDown) {
      playerVelocity.x = -speed;
      this.player.anims.play(`left`, true);
    }
    else if (this.cursors.right.isDown) {
      playerVelocity.x = speed;
      this.player.anims.play('right', true);
    }
    else if (this.cursors.up.isDown) {
      playerVelocity.y = -speed;
      this.player.anims.play('up', true);
    }
    else if (this.cursors.down.isDown) {
      playerVelocity.y = speed;
      this.player.anims.play('down', true);
    }
    else {
      playerVelocity.x = 0;
      playerVelocity.y = 0;
      this.player.anims.stop()
    }

    playerVelocity.normalize();
    playerVelocity.scale(speed);
    this.player?.setVelocity(playerVelocity.x, playerVelocity.y);

    if (isCollidingWithMap(this.player)) {this.player.x = this.player.oldPosition.x;} //충돌하면 예전 x에서 더 못나감
    if (isCollidingWithMap(this.player)) {this.player.y = this.player.oldPosition.y;}
    
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    let x = this.player.x;
    let y = this.player.y;

    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y})
    }

    // 플레이어 예전위치
    this.player.oldPosition = {
        x: this.player.x, 
        y: this.player.y, 
      };


  //// 건물 중심 좌표 및 범위, 건물 범위 체크함수
    if (x >= 145 && x <= 224 && y>= 208 && y <=256){  //상점: x: 145 ~ 224, y: 208~256
      shop.style.display = "block";
    } else if (x >= 466 && x <= 526 && y>= 208 && y <=256){ //부동산: x: 466~526, y:208~256
      estate.style.display = "block";
    } else if (x>=784 && x <=814 && y>= 192 && y <=224){ //학원: x:784~814 y:192~224
      academy.style.display = "block";
      const academy_quiz = document.getElementById('academy_quiz');
      academy_quiz.addEventListener('click', ()=> {
        quiz2.style.display = "block";
      })

  } else if (x>=1011 && x <=1264 && y>= 98 && y <=190){
    console.log('공사장')
  } else if (x >= 1011 && x <=1230 && y >= 32 && y <=208){ //노가다: x: 816~1040, y:32~208
    console.log('공사장')
  } else if (x >= 145 && x <= 224 && y >= 641 && y <=672){ //경찰: x: 64~128, y:592~656
    p_quiz1.style.display = "block";
    p_answerQ1.style.display = "none";
    p_score = 0;
    if (!isPQ1Opened) {
      openPQ1();
      isPQ1Opened = true;
    }
  } else if (x >= 466 && x <= 526 && y>= 608 && y <= 640){ //집: x: 465~524, y: 592~656
    home.style.display = "block";
  } else if (x>= 754 && x <= 814 && y>= 608 && y <= 674){ //은행: x:754 ~ 814, y: 608~674
    openBank();
  } else if (x>= 1072 && x <=1136 && y>= 640 && y <=674){ //병원: x:896~960 , 은행: y: 641~670
    openClinic();
  } else {
    closeModal();
  }
}
}


function addPlayer(self, playerInfo) {
self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar.name).setOrigin(0.5, 0.5);
self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 3, end: 5 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'up',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 6, end: 8 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 9, end: 11 }),
    frameRate: 10,
    repeat: -1
  })
  self.anims.create({
    key: 'down',
    frames: self.anims.generateFrameNumbers(playerInfo.avatar.name, { start: 0, end: 2 }),
    frameRate: 10,
    repeat: -1})
}

function addOtherPlayers(self, playerInfo) {
const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, playerInfo.avatar.name).setOrigin(0.5, 0.5);
otherPlayer.playerId = playerInfo.playerId;
self.otherPlayers.add(otherPlayer);
}

function createAnims(playerInfo){
self.anims.create({
  key: 'left',
  frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 3, end: 5 }),
  frameRate: 10,
  repeat: -1
})
self.anims.create({
  key: 'up',
  frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 6, end: 8 }),
  frameRate: 10,
  repeat: -1
})
self.anims.create({
  key: 'right',
  frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 9, end: 11 }),
  frameRate: 10,
  repeat: -1
})
self.anims.create({
  key: 'down',
  frames: self.anims.generateFrameNumbers(playerInfo.avatar, { start: 0, end: 2 }),
  frameRate: 10,
  repeat: -1})
}

const colliMap = [
[715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
[715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0,   0, 715, 715, 715, 715,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715, 715, 715, 715,   0, 715, 715,   0, 715, 715,   0,   0, 715, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[715, 715, 715, 715,   0,   0,   0, 715, 715,   0, 715, 715,   0, 715,   0,   0,   0, 715,   0, 715, 715,   0,   0, 715,   0,   0, 715,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
[715, 715, 715, 715,   0,   0,   0, 715, 715,   0, 715, 715,   0, 715,   0,   0,   0, 715,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[715, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,],
[715,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,],
[  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,],
[715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715, 715, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715,   0,   0,   0,   0, 715,   0,   0,   0, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715, 715, 715, 715, 715, 715,   0, 715,],
[715, 715, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0,   0, 715,   0,   0,   0, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0, 715,],
[715, 715, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715, 715,   0,   0,   0, 715, 715,   0,   0,   0,   0, 715,   0,   0,   0, 715,   0,   0, 715,],
[715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
[715, 715, 715,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0, 715,],
[715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715, 715]
]


function isColliding(rect1, rect2) { //충돌감지함수: 사각형
return (
  rect1.x < rect2.x + rect2.w &&
  rect1.x + rect1.w > rect2.x &&
  rect1.y < rect2.y + rect2.h &&
  rect1.h + rect1.y > rect2.y
);
}

function isCollidingWithMap(player) {
for (let row = 0; row < colliMap.length; row++) {
  for (let col = 0; col < colliMap[0].length; col++) {
    const tile = colliMap[row][col];

    if (tile && isColliding(
        {//사각형1: 플레이어
          x: player.x - 32/2,
          y: player.y,
          w: 32, 
          h: 32,
        },
        {//사각형2: 타일
          x: col * 32,
          y: row * 32,
          w: 32,
          h: 32,
        }
      )
    ) {
      return true;
    }
  }
}
return false;
}


//모달
const select = document.getElementById('select');
const staff = document.getElementById('staff');
const visitor = document.getElementById('visitor');

const bankSelect = document.getElementById('bankSelect');
const bankact = document.getElementById('bankact');
const bank_origin = `
<button type="button" class="BankActBtn" style="width: 139px; height: 51px; left: 21px; top: 268px; position: absolute">
    <div class="BankActBtnbox" style="width: 139px; height: 51px; left: 0px; top: 0px; position: absolute; border-radius: 15px"></div>
    <div class="BankActTxt" style="width: 118px; height: 23px; left: 11px; top: 11px; position: absolute; text-align: center; color: black; font-size: 25px; font-family: Sunflower; font-weight: 500; word-wrap: break-word">예금</div>
</button>`

const shop = document.getElementById('shop');
const estate = document.getElementById('estate');
const academy = document.getElementById('academy');


const home = document.getElementById('home');
const loading = document.getElementById('loading');

const result = document.getElementById('result');

let isPQ1Opened = false;
const p_quiz1 = document.getElementById('p_quiz1')
const p_answerQ1 = document.getElementById('p_answerQ1');
const p_answerCloseQ1 = document.getElementById('p_answerCloseQ1').addEventListener('click', ()=>{
  p_answerQ1.style.display = 'none';
})
const b_quiz1 = document.getElementById('b_quiz1')
const b_answerQ1 = document.getElementById('b_answerQ1');
const b_answerCloseQ1 = document.getElementById('b_answerCloseQ1').addEventListener('click', ()=>{
  b_answerQ1.style.display = 'none';
})
const c_quiz1 = document.getElementById('c_quiz1')
const c_answerQ1 = document.getElementById('c_answerQ1');
const c_answerCloseQ1 = document.getElementById('c_answerCloseQ1').addEventListener('click', ()=>{
  c_answerQ1.style.display = 'none';
})

const academy_quiz = document.getElementById('academy_quiz');
const quiz2 = document.getElementById('quiz2');

//bank
const saving = document.getElementById('saving');
const withdraw = document.getElementById('withdraw');
const getLoan = document.getElementById('getLoan');
const repay = document.getElementById('repay');
const bankInput = document.getElementById('bankInput');
const bankActBtn = document.getElementById('bankActBtn');
const bankBackBtn = document.getElementById('bankBackBtn');
//clinic
const clinic = document.getElementById('clinic');
const clinic_work = document.getElementById('clinic_work');
const treatment = document.getElementById('treatment');
//estate
const sell_h = document.getElementById('sell_h');
const buy_h = document.getElementById('buy_h');
//mart
const inHigh = document.getElementById('inHigh');
const inLow = document.getElementById('inLow');
const energy = document.getElementById('energy');
const food = document.getElementById('food');
const book = document.getElementById('book');


function closeModal(){
  select.style.display = "none"
  bankSelect.style.display = "none"
  shop.style.display = "none";
  estate.style.display = "none";
  academy.style.display = "none"
  home.style.display = "none";
  clinic.style.display = "none";
  bankact.style.display = "none";

  quiz2.style.display = "none";

  p_quiz1.style.display = "none";
  b_quiz1.style.display = "none";
  c_quiz1.style.display = "none";
  
  final.style.display = "none";
  result.style.display = "none";
  loading.style.display = "none";
}

const rest = document.getElementById('rest');
let restClicked = false;

rest.addEventListener('click', ()=>{
  home.style.display = "none";
  restClicked = true;
  fetch('/atHome', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({health: 1000})
  }).then(response => response.json())
    .then(data => {
      console.log(data);
    });
})

function sendupdate(action, callback){
  fetch('/update',{
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type': 'application/json'},
    body:JSON.stringify({action: action})
  })
  .then(response => response.json())
  .then(data => {
    callback(data);
  });
}
//mart
inHigh.addEventListener('click',()=>{
  console.log('inhigh')
  sendupdate('insurance_1', (data)=>{
    alert(data.msg);
  })
})
inLow.addEventListener('click',()=>{
  console.log('inlow')
  sendupdate('insurance_2', (data)=>{
    alert(data.msg);
  })
})
energy.addEventListener('click',()=>{
  console.log('energy')
  sendupdate('drinking', (data)=>{
    alert(data.msg);
  })
})
food.addEventListener('click',()=>{
  console.log('food')
  sendupdate('eating', (data)=>{
    alert(data.msg);
  })
})
book.addEventListener('click',()=>{
  console.log('book')
  sendupdate('reading', (data)=>{
    alert(data.msg);
  })
})
//estate
sell_h.addEventListener('click', ()=>{
  console.log('집 팔기');
  sendupdate('selling_room',(data)=>{
    alert(data.msg);
  });
})

buy_h.addEventListener('click', ()=>{
  console.log('집 사기');
  sendupdate('buying_room',(data)=>{
    alert(data.msg);
  });
})

//은행
function openBank(){
  select.style.display = "block";
  const staffClick = ()=>{
    select.style.display = "none";
    console.log('은행알바');
    openBQ1();
    staff.removeEventListener('click', staffClick);
  };

  if (staff._staffClick) {
    staff.removeEventListener('click', staff._staffClick);
  }
  staff._staffClick = staffClick;
  staff.addEventListener('click', staffClick); 

  visitor.addEventListener('click', ()=>{
    select.style.display = "none";
    select.style.display = "0";
    bankSelect.style.display = "block";
    select_bankwork();
  })
}
const handleSave = ()=>{
  const save_Amount = bankInput.value;
  console.log(isNaN(save_Amount))
  if (!isNaN(save_Amount)) {
    fetch('/savings', {
        method: 'POST',
        credentials: 'same-origin', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ saveAmount: save_Amount })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.msg)
    });

  }else {
    alert('금액을 입력해주세요!');
  }
};
const handleWithdraw = ()=>{
  const draw_Amount = bankInput.value;
  if (!isNaN(draw_Amount)) {
    fetch('/withdraw', {
        method: 'POST', 
        credentials: 'same-origin', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ withdrawAmount: draw_Amount })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.msg)
    });
  }
  else {
      alert('금액을 입력해주세요');
  }
  
};
const handleLoan = ()=>{
  const loan_Amount = bankInput.value;
  if (!isNaN(loan_Amount)) {
    fetch('/get_loan', {
        method: 'POST', 
        credentials: 'same-origin', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ loanAmount: loan_Amount })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.msg)
    });
  }
  else {
      alert('금액을 입력해주세요.');
  }
};


const handleRepay = ()=>{
  const repay_Amount = bankInput.value;
  if (!isNaN(repay_Amount)) {
    fetch('/repay', {
        method: 'POST', 
        credentials: 'same-origin', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ repayLoan: repay_Amount })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.msg);
    });
}
else {
    alert('금액을 입력해주세요!');
}
  console.log('상환')
};

function select_bankwork(){
  saving.addEventListener('click', ()=>{
    select.style.display = "none";
    bankSelect.style.display = "none";
    bankact.style.display = "block";
    bankActBtn.textContent = "예금";
    bankActBtn.removeEventListener('click', handleWithdraw);
    bankActBtn.removeEventListener('click', handleLoan);
    bankActBtn.removeEventListener('click', handleRepay);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleSave);
  })
  withdraw.addEventListener('click', ()=>{
    select.style.display = "none";
    bankSelect.style.display = "none";
    bankact.style.display = "block";
    bankActBtn.textContent = "출금";
    bankActBtn.removeEventListener('click', handleSave);
    bankActBtn.removeEventListener('click', handleLoan);
    bankActBtn.removeEventListener('click', handleRepay);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleWithdraw);
  })

  getLoan.addEventListener('click', ()=>{
    bankact.style.display = "block";
    bankActBtn.textContent = "대출";
    bankActBtn.removeEventListener('click', handleSave);
    bankActBtn.removeEventListener('click', handleWithdraw);
    bankActBtn.removeEventListener('click', handleRepay);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleLoan);
  })

  repay.addEventListener('click', ()=>{
    bankact.style.display = "block";
    bankActBtn.textContent = "상환";
    bankActBtn.removeEventListener('click', handleSave);
    bankActBtn.removeEventListener('click', handleWithdraw);
    bankActBtn.removeEventListener('click', handleLoan);
    bankInput.value = '';
    bankActBtn.addEventListener('click', handleRepay);
  })
}

bankBackBtn.addEventListener('click', ()=>{
  bankInput.value = '';
  bankact.style.display = "none";
  bankSelect.style.display = "block";
  console.log('이전화면')
})

const b_question1 = document.getElementById('b_question1')
const b_o_btn= document.getElementById('b_o_btn');
const b_x_btn = document.getElementById('b_x_btn');

//은행퀴즈
function openBQ1(){
  b_quiz1.style.display = "block";
  b_answerQ1.style.display = "none";
  let b_score = 0;

  fetch('/findBQ1', {
    method: 'POST',
    body: JSON.stringify({bank:'bank'}),
    headers: { 'Content-Type': 'application/json' }
   })
  .then(response => response.json())
  .then(data => {
    const bq = data.bq;
    const ba = data.ba;
    const b_point = data.bpoint;
    b_question1.innerHTML = bq;

    console.log(bq)

    if (b_o_btn.bOClick){
      b_o_btn.removeEventListener('click', b_o_btn.bOClick)
    }
    b_o_btn.bOClick = ()=>{
      if (ba === '0'){
        b_score += b_point;
        alert('맞았습니다! 현재 점수:'+ b_score);
      } else {
        alert('틀렸습니다. 5초간 정답을 확인하세요.')
        b_answerQ1.style.display = "block";
      }
    };
    b_o_btn.addEventListener('click', b_o_btn.bOClick)

    if (b_x_btn.bXClick){
      b_x_btn.removeEventListener('click', b_x_btn.bXClick);
    }
    b_x_btn.bXClick = () => {
      if (ba === '1') {
        b_score += b_point;
        alert('맞았습니다! 현재 점수:' + b_score);
        b_quiz1.style.display = "none";
      } else {
        alert('틀렸습니다. 정답을 확인하세요.');
        b_answerQ1.style.display = "block";
      }
    };
    b_x_btn.addEventListener('click', b_x_btn.bXClick);
  }); 
}

//경찰퀴즈
const p_question1 = document.getElementById('p_question1')
const p_o_btn= document.getElementById('p_o_btn');
const p_x_btn = document.getElementById('p_x_btn');

function openPQ1(){

  fetch('/findPQ1', {
    method: 'POST',
    body: JSON.stringify({police:'police'}),
    headers: { 'Content-Type': 'application/json' }
   })
  .then(response => response.json())
  .then(data => {
    const pq = data.pq;
    const pa = data.pa;
    const p_point = data.ppoint;
    p_question1.innerHTML = pq;
    let p_score = 0;

    console.log(pq)

    if (p_o_btn.pOClick){
      p_o_btn.removeEventListener('click', p_o_btn.pOClick)
    }
    p_o_btn.pOClick = ()=>{
      if (pa === '0'){
        p_score += p_point;
        alert('맞았습니다! 현재 점수:'+ p_score);
      } else {
        alert('틀렸습니다. 5초간 정답을 확인하세요.')
        p_answerQ1.style.display = "block";
      }
    };
    p_o_btn.addEventListener('click', p_o_btn.pOClick)

    if (p_x_btn.bXClick){
      p_x_btn.removeEventListener('click', p_x_btn.pXClick);
    }
    p_x_btn.pXClick = () => {
      if (pa === '1') {
        p_score += p_point;
        alert('맞았습니다! 현재 점수:' + p_score);
        p_quiz1.style.display = "none";
      } else {
        alert('틀렸습니다. 정답을 확인하세요.');
        p_answerQ1.style.display = "block";
      }
    };
    p_x_btn.addEventListener('click', p_x_btn.pXClick);
  }); 
}

//병원
function openClinic(){
  clinic.style.display = "block";

  const clinicWClick = ()=>{
    clinic.style.display = "none";
    console.log('병원일');
    openCQ1();
    clinic_work.removeEventListener('click', clinicWClick);
  };

  if (clinic_work._clinicWClick) {
    clinic_work.removeEventListener('click', clinic_work._clinicWClick);
  }
  clinic_work._clinicWClick = clinicWClick;
  clinic_work.addEventListener('click', clinicWClick); 

  treatment.addEventListener('click', ()=>{
    clinic.style.display = "none";
    console.log('치료')
  })
}

//병원퀴즈
const c_question1 = document.getElementById('c_question1')
const c_o_btn = document.getElementById('c_o_btn');
const c_x_btn = document.getElementById('c_x_btn');

function openCQ1(){
  c_quiz1.style.display = "block";
  c_answerQ1.style.display = "none";
  let c_score = 0;

  fetch('/findCQ1', {
    method: 'POST',
    body: JSON.stringify({clinic:'clinic'}),
    headers: { 'Content-Type': 'application/json' }
   })
  .then(response => response.json())
  .then(data => {
    const cq = data.cq;
    const ca = data.ca;
    const c_point = data.cpoint;
    c_question1.innerHTML = cq;

    console.log(cq)

    if (c_o_btn.cOClick){
      c_o_btn.removeEventListener('click', c_o_btn.cOClick)
    }
    c_o_btn.cOClick = ()=>{
      if (ca === '0'){
        c_score += c_point;
        alert('맞았습니다! 현재 점수:'+ c_score);
      } else {
        alert('틀렸습니다. 5초간 정답을 확인하세요.')
        c_answerQ1.style.display = "block";
      }
    };
    c_o_btn.addEventListener('click', c_o_btn.cOClick)

    if (c_x_btn.cXClick){
      c_x_btn.removeEventListener('click', c_x_btn.cXClick);
    }
    c_x_btn.cXClick = () => {
      if (ca === '1') {
        c_score += c_point;
        alert('맞았습니다! 현재 점수:' + c_score);
      } else {
        alert('틀렸습니다. 정답을 확인하세요.');
        c_answerQ1.style.display = "block";
      }
    };
    c_x_btn.addEventListener('click', c_x_btn.cXClick);
  }); 
}