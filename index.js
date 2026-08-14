const express = require('express');
const cors = require('cors');
const { kv } = require('@vercel/kv');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function getUsers() {
  try {
    const data = await kv.get('users');
    return data || [];
  } catch (e) {
    console.error('读取用户数据失败:', e);
    return [];
  }
}

async function saveUsers(users) {
  try {
    await kv.set('users', users);
  } catch (e) {
    console.error('保存用户数据失败:', e);
  }
}

async function getStars() {
  try {
    const data = await kv.get('stars');
    return data || [];
  } catch (e) {
    console.error('读取星星数据失败:', e);
    return [];
  }
}

async function saveStars(stars) {
  try {
    await kv.set('stars', stars);
  } catch (e) {
    console.error('保存星星数据失败:', e);
  }
}

app.get('/getUser', async (req, res) => {
  const uid = req.query.uid;
  let users = await getUsers();
  let user = users.find(item => item.uid === uid);
  if (!user) {
    user = { uid, partner: "" };
    users.push(user);
    await saveUsers(users);
  }
  res.json({ code: 200, data: user });
});

app.post('/bind', async (req, res) => {
  const { myUid, partnerUid } = req.body;
  let users = await getUsers();
  let me = users.find(item => item.uid === myUid);
  let partner = users.find(item => item.uid === partnerUid);
  if (!me) { me = { uid: myUid, partner: "" }; users.push(me); }
  if (!partner) { partner = { uid: partnerUid, partner: "" }; users.push(partner); }
  me.partner = partnerUid;
  partner.partner = myUid;
  await saveUsers(users);
  res.json({ code: 200, msg: "绑定成功" });
});

app.post('/addStar', async (req, res) => {
  const { uid, reason, process, level, preSolve } = req.body;
  const star = {
    sid: "STAR" + Date.now(),
    owner: uid, reason, process, level, preSolve,
    finalSolve: "", time: Date.now()
  };
  let stars = await getStars();
  stars.push(star);
  await saveStars(stars);
  res.json({ code: 200, msg: "添加成功" });
});

app.get('/getStars', async (req, res) => {
  const uid = req.query.uid;
  const users = await getUsers();
  const user = users.find(item => item.uid === uid);
  if (!user) return res.json({ code: 200, data: [] });
  const allStars = await getStars();
  const coupleStars = allStars.filter(
    star => star.owner === uid || star.owner === user.partner
  );
  res.json({ code: 200, data: coupleStars });
});

app.post('/saveSolve', async (req, res) => {
  const { sid, finalSolve } = req.body;
  let stars = await getStars();
  const star = stars.find(item => item.sid === sid);
  if (star) { star.finalSolve = finalSolve; await saveStars(stars); }
  res.json({ code: 200, msg: "保存成功" });
});

app.listen(port, () => {
  console.log("couple-server 后端启动成功，端口：" + port);
});
