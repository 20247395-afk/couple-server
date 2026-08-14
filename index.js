const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取数据失败:', e);
  }
  return { users: [], stars: [] };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

app.get('/getUser', (req, res) => {
  const uid = req.query.uid;
  const data = readData();
  let user = data.users.find(item => item.uid === uid);
  if (!user) {
    user = { uid, partner: "" };
    data.users.push(user);
    saveData(data);
  }
  res.json({ code: 200, data: user });
});

app.post('/bind', (req, res) => {
  const { myUid, partnerUid } = req.body;
  const data = readData();
  let me = data.users.find(item => item.uid === myUid);
  let partner = data.users.find(item => item.uid === partnerUid);
  if (!me) { me = { uid: myUid, partner: "" }; data.users.push(me); }
  if (!partner) { partner = { uid: partnerUid, partner: "" }; data.users.push(partner); }
  me.partner = partnerUid;
  partner.partner = myUid;
  saveData(data);
  res.json({ code: 200, msg: "绑定成功" });
});

app.post('/addStar', (req, res) => {
  const { uid, reason, process, level, preSolve } = req.body;
  const star = {
    sid: "STAR" + Date.now(),
    owner: uid, reason, process, level, preSolve,
    finalSolve: "", time: Date.now()
  };
  const data = readData();
  data.stars.push(star);
  saveData(data);
  res.json({ code: 200, msg: "添加成功" });
});

app.get('/getStars', (req, res) => {
  const uid = req.query.uid;
  const data = readData();
  const user = data.users.find(item => item.uid === uid);
  if (!user) return res.json({ code: 200, data: [] });
  const coupleStars = data.stars.filter(
    star => star.owner === uid || star.owner === user.partner
  );
  res.json({ code: 200, data: coupleStars });
});

app.post('/saveSolve', (req, res) => {
  const { sid, finalSolve } = req.body;
  const data = readData();
  const star = data.stars.find(item => item.sid === sid);
  if (star) { star.finalSolve = finalSolve; saveData(data); }
  res.json({ code: 200, msg: "保存成功" });
});

app.get('/', (req, res) => {
  res.json({ code: 200, msg: "情侣星星后端运行中" });
});

app.listen(port, () => {
  console.log("couple-server 后端启动成功，端口：" + port);
});
