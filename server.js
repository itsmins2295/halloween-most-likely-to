const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const app = express();
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const io = new Server(server);
const questions = [
"Who would survive the LEAST amount of time in a horror movie?",
"Who would accidentally join a cult?",
"Who would flirt with the killer instead of running away?",
"Who would be the first to get possessed?",
"Who would secretly be the villain in a horror movie?",
"Who would sell their haunted house without disclosing the ghosts?",
"Who would make the WORST getaway driver?",
"Who would try to negotiate with a vampire?",
"Who would investigate a creepy noise instead of running?",
"Who would accidentally summon a demon?",
"Who would befriend the ghost haunting their house?",
"Who would abandon the group first in a zombie apocalypse?",
"Who would make a horror movie all about themselves?",
"Who would spend the night in a haunted asylum for $100?",
"Who would scream first in a haunted house?",
"Who would accidentally text the killer their location?",
"Who would bring snacks to a séance?",
"Who would try to take a selfie with a ghost?",
"Who would get kicked out of a vampire coven?",
"Who would fall in love with a zombie?"
];
const rooms = new Map();
function code(){let s; do{s=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(s));return s;}
function publicState(r){return {code:r.code,phase:r.phase,round:r.round,question:questions[r.round],total:questions.length,players:[...r.players.values()].map(p=>({id:p.id,name:p.name})),votesCount:r.votes.size,results:r.phase==='results'?tally(r):null};}
function tally(r){const c=[...r.players.values()].map(p=>({id:p.id,name:p.name,votes:0}));for(const id of r.votes.values()){const item=c.find(x=>x.id===id);if(item)item.votes++}return c.sort((a,b)=>b.votes-a.votes)}
function emit(r){io.to(r.code).emit('state', publicState(r));}
app.get('/api/qr/:code',async(req,res)=>{const r=rooms.get(req.params.code.toUpperCase());if(!r)return res.status(404).send('Game not found');const url=`${req.protocol}://${req.get('host')}/?room=${r.code}`;res.type('png').send(await QRCode.toBuffer(url,{width:560,margin:2,color:{dark:'#f9f1f9',light:'#25142d'}}));});
io.on('connection',socket=>{
 socket.on('create',(_,cb)=>{const c=code(), secret=crypto.randomBytes(24).toString('hex');const r={code:c,secret,host:socket.id,phase:'lobby',round:0,players:new Map(),votes:new Map()};rooms.set(c,r);socket.join(c);cb({ok:true,code:c,secret});emit(r)});
 socket.on('host_rejoin',({code,secret},cb)=>{const r=rooms.get(String(code).toUpperCase());if(!r||r.secret!==secret)return cb({error:'Host session expired. Create a new game.'});r.host=socket.id;socket.join(r.code);cb({ok:true});emit(r)});
 socket.on('join',({code,name,playerId},cb)=>{const r=rooms.get(String(code).toUpperCase());if(!r)return cb({error:'Game not found. Check the room code.'});if(r.phase==='finished')return cb({error:'This game has ended.'});const n=String(name||'').trim().slice(0,24);if(!n)return cb({error:'Enter your name.'});if(r.players.size>=60&&!r.players.has(playerId))return cb({error:'Game is full.'});let p=playerId&&r.players.get(playerId);if(p){p.socket=socket.id;}else{if([...r.players.values()].some(p=>p.name.toLowerCase()===n.toLowerCase()))return cb({error:'That name is taken. Pick another.'});p={id:crypto.randomUUID(),name:n,socket:socket.id};r.players.set(p.id,p)}socket.join(r.code);socket.data={code:r.code,playerId:p.id};cb({ok:true,playerId:p.id});emit(r)});
 socket.on('vote',({code,playerId,targetId},cb)=>{const r=rooms.get(String(code).toUpperCase());if(!r||r.phase!=='voting')return cb({error:'Voting is not open.'});const p=r.players.get(playerId);if(!p||p.socket!==socket.id)return cb({error:'Rejoin the game to vote.'});if(!r.players.has(targetId))return cb({error:'Invalid choice.'});if(r.votes.has(playerId))return cb({error:'You already voted this round.'});r.votes.set(playerId,targetId);cb({ok:true});emit(r)});
 socket.on('host_action',({code,secret,action},cb)=>{const r=rooms.get(String(code).toUpperCase());if(!r||r.secret!==secret||r.host!==socket.id)return cb({error:'Host access denied.'});if(action==='start'&&r.phase==='lobby'){if(r.players.size<3)return cb({error:'At least 3 guests must join.'});r.phase='voting'}else if(action==='reveal'&&r.phase==='voting'){r.phase='results'}else if(action==='next'&&r.phase==='results'){if(r.round+1>=questions.length){r.phase='finished'}else{r.round++;r.votes.clear();r.phase='voting'}}else if(action==='restart'){r.round=0;r.votes.clear();r.phase='lobby'}else return cb({error:'Action not available.'});cb({ok:true});emit(r)});
 socket.on('disconnect',()=>{ /* players remain eligible; reconnect with same ID */ });
});
setInterval(()=>{ /* single-use party rooms are intentionally held until server restart */ },3600000).unref();
const port=process.env.PORT||3000;server.listen(port,()=>console.log('Halloween game ready on port',port));
