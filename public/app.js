let socket;
let state = null;
let view = 'home';
let toast = '';
let ruleIntroOpen = false;

const $ = (id) => document.getElementById(id);
const app = $('app');

function connectSocket() {
  if (typeof io === 'undefined') {
    socket = null;
    renderStaticFallback();
    return;
  }
  socket = io();
  socket.on('roomState', (nextState) => {
    state = nextState;
    if (state.phase === 'waiting' && state.mode === 'online') view = 'roomLobby';
    if (state.mode === 'local' || state.phase !== 'waiting') view = 'gameTable';
    render();
  });
  socket.on('errorMessage', (message) => {
    toast = message;
    render();
  });
}

function renderStaticFallback() {
  app.innerHTML = `<section class="panel cover-card"><h2>需要 Node.js 服务端运行</h2><p>当前页面已经加载到炸金花娱乐模拟器前端，但没有连接到 Socket.IO 服务端。请在项目根目录运行：</p><ol><li><code>npm install</code></li><li><code>npm start</code></li><li>打开 <code>http://localhost:3000</code></li></ol><p class="notice-inline">本项目不支持仅靠 GitHub Pages 完整运行；联机、AI、发牌、下注、比牌和结算都依赖内存服务端，且不会保存长期积分。</p></section>`;
}

connectSocket();

function go(nextView) {
  view = nextView;
  render();
}

function nickname(id = 'nick') {
  return $(id)?.value.trim() || '';
}

function defaultLocalSettings() {
  return { maxPlayers: 4, initialPoints: 1000, ante: 50, allowAI: true, aiDifficulty: 'normal' };
}

function settings(prefix = '') {
  const byId = (name) => $(`${prefix}${name}`);
  return {
    maxPlayers: +(byId('maxPlayers')?.value || 4),
    initialPoints: +(byId('initialPoints')?.value || 1000),
    ante: +(byId('ante')?.value || 50),
    allowAI: byId('allowAI')?.checked ?? true,
    aiDifficulty: byId('aiDifficulty')?.value || 'normal',
  };
}

function emitSettings(prefix = '') {
  if (!socket) return renderStaticFallback();
  socket.emit('updateSettings', settings(prefix));
}

function quickStartLocalGame() {
  if (!socket) return renderStaticFallback();
  view = 'gameTable';
  socket.emit('createRoom', { nickname: nickname('soloNick'), mode: 'local', autoStart: true, settings: defaultLocalSettings() });
}

function startCustomLocalGame() {
  if (!socket) return renderStaticFallback();
  view = 'gameTable';
  socket.emit('createRoom', { nickname: nickname('soloNick'), mode: 'local', autoStart: true, settings: { ...settings('solo'), allowAI: true } });
}

function createOnlineRoom() {
  if (!socket) return renderStaticFallback();
  view = 'roomLobby';
  socket.emit('createRoom', { nickname: nickname('hostNick') || '房主', mode: 'online', settings: settings('online') });
}

function joinRoom() {
  if (!socket) return renderStaticFallback();
  view = 'onlineEntry';
  socket.emit('joinRoom', { roomCode: $('roomCode')?.value, nickname: nickname('joinNick') });
}

function copyRoomCode() {
  if (!state?.code) {
    toast = '暂无房间码';
    return render();
  }
  navigator.clipboard?.writeText(state.code)
    .then(() => { toast = '房间码已复制'; render(); })
    .catch(() => { toast = '复制失败，请手动复制'; render(); });
}

function me() {
  return socket && state?.players?.find((p) => p.id === socket.id);
}

function isHost() {
  return !!me()?.isHost;
}

function canAct() {
  const p = me();
  return state?.phase === 'playing' && p?.current && !p.eliminated && !p.spectator && !p.folded;
}

function sendAction(action) {
  if (!socket) return;
  const data = { action };
  if (action === 'raise') data.amount = +($('raiseAmount')?.value || 0);
  if (action === 'compare') data.targetPlayerId = $('compareTarget')?.value;
  socket.emit('action', data);
}

function chooseSpectateTarget() {
  if (socket) socket.emit('spectate', $('spectateTarget')?.value);
}

function startOnlineGame(withAI = false) {
  if (!socket) return;
  socket.emit(withAI ? 'startWithAI' : 'startGame');
  view = 'gameTable';
}

function toggleReady() {
  if (socket) socket.emit('toggleReady');
}

function render() {
  const toastHtml = toast ? `<div class="panel toast">${toast}</div>` : '';
  const content = state ? renderStatefulView() : renderViewWithoutRoom();
  document.body.dataset.view = view;
  app.innerHTML = `${toastHtml}${content}${renderRuleIntroModal()}`;
  toast = '';
}

function renderViewWithoutRoom() {
  if (view === 'soloSetup') return renderSoloSetup();
  if (view === 'onlineEntry') return renderOnlineEntry();
  return renderHome();
}

function renderStatefulView() {
  if (view === 'roomLobby' && state?.phase === 'waiting' && state?.mode === 'online') return renderRoomLobby();
  if (view === 'onlineEntry') return renderOnlineEntry();
  if (view === 'soloSetup') return renderSoloSetup();
  if (view === 'home') return renderHome();
  return renderGameTable();
}

function renderHome() {
  return `<section class="cover"><div class="cover-card"><span class="eyebrow">纯娱乐 · 扑克牌规则模拟</span><h2>炸金花娱乐模拟器</h2><p class="subtitle">纯娱乐扑克牌规则模拟，支持单机 AI 与联机房间。</p><p class="compliance-text">本游戏仅为规则娱乐模拟，不涉及真实金钱、充值、提现、兑换、奖励或任何形式的赌博行为。所有积分仅为本场临时娱乐分数，游戏结束后自动清零。</p><div class="cover-actions"><button class="primary-start" onclick="go('soloSetup')">单机模式</button><button class="outline-start" onclick="go('onlineEntry')">联机模式</button></div></div></section>`;
}

function renderSoloSetup() {
  return `<section class="page-head"><button class="secondary" onclick="go('home')">返回首页</button><div><span class="eyebrow">Solo</span><h2>单机模式</h2><p>与 AI 玩家进行本地对局，练习牌型判断、下注、弃牌与比牌。</p></div></section><section class="grid"><div class="panel hero"><h3>快速开始</h3><p>默认 4 人：你 + 3 名普通 AI；初始临时积分 1000，底注 50，开启动画。</p><input id="soloNick" placeholder="你的名称（可空）"><button class="primary-start" onclick="quickStartLocalGame()">快速开始</button></div><div class="panel"><h3>自定义开始</h3>${settingsHtml('solo', defaultLocalSettings(), false)}<button onclick="startCustomLocalGame()">开始单机游戏</button></div></section>`;
}

function renderOnlineEntry() {
  return `<section class="page-head"><button class="secondary" onclick="go('home')">返回首页</button><div><span class="eyebrow">Online</span><h2>联机模式</h2><p>创建房间并复制房间码，或输入房间码加入好友对局。</p></div></section><section class="grid two"><div class="panel"><h3>创建房间</h3><input id="hostNick" value="房主" placeholder="你的名称"><h4>房间参数</h4>${settingsHtml('online', defaultLocalSettings(), true)}<button onclick="createOnlineRoom()">创建房间</button></div><div class="panel"><h3>加入房间</h3><input id="joinNick" placeholder="你的名称（可空）"><input id="roomCode" placeholder="输入房间码"><button onclick="joinRoom()">加入房间</button></div></section>`;
}

function settingsHtml(prefix = '', values = state?.settings || defaultLocalSettings(), includeAI = true) {
  return `<div class="settings-grid"><label>玩家人数<input id="${prefix}maxPlayers" type="number" min="2" max="8" value="${values.maxPlayers || 4}" onchange="emitSettings('${prefix}')"></label><label>初始临时积分<input id="${prefix}initialPoints" type="number" value="${values.initialPoints || 1000}" onchange="emitSettings('${prefix}')"></label><label>底注<input id="${prefix}ante" type="number" value="${values.ante || 50}" onchange="emitSettings('${prefix}')"></label>${includeAI ? `<label class="checkline"><input id="${prefix}allowAI" type="checkbox" ${values.allowAI !== false ? 'checked' : ''} onchange="emitSettings('${prefix}')">允许 AI 补位</label>` : '<input id="soloallowAI" type="hidden" checked>'}<label>AI 难度<select id="${prefix}aiDifficulty" onchange="emitSettings('${prefix}')"><option value="easy" ${values.aiDifficulty === 'easy' ? 'selected' : ''}>简单</option><option value="normal" ${!values.aiDifficulty || values.aiDifficulty === 'normal' ? 'selected' : ''}>普通</option><option value="hard" ${values.aiDifficulty === 'hard' ? 'selected' : ''}>困难</option><option value="aggressive" ${values.aiDifficulty === 'aggressive' ? 'selected' : ''}>激进</option></select></label><label class="checkline"><input type="checkbox" checked>开启动画</label></div>`;
}

function renderRoomLobby() {
  const players = state.players || [];
  return `<section class="lobby"><div class="lobby-main panel"><div class="page-head compact"><button class="secondary" onclick="go('home')">返回首页</button><div><span class="eyebrow">Room Lobby</span><h2>房间大厅</h2><p>等待好友加入，房主可调整本场临时规则。</p></div></div><div class="room-code"><strong>${state.code}</strong><button class="secondary" onclick="copyRoomCode()">复制房间码</button><span>${players.length} / ${state.settings.maxPlayers} 人</span></div><div class="lobby-list">${players.map(renderLobbyPlayer).join('')}</div><div class="lobby-actions">${isHost() ? `<button onclick="startOnlineGame(false)">开始游戏</button><button class="secondary" onclick="startOnlineGame(true)">AI 补位后开始</button>` : `<button onclick="toggleReady()">${me()?.ready ? '取消准备' : '准备'}</button>`}</div></div>${isHost() ? `<aside class="panel"><h3>房主设置</h3>${settingsHtml('', state.settings, true)}</aside>` : ''}</section>`;
}

function renderLobbyPlayer(player) {
  return `<div class="lobby-player"><strong>${player.nickname}</strong><span>${player.isHost ? '房主' : '玩家'}</span><span>${player.isAI ? `AI ${player.aiDifficulty}` : '真人'}</span><span>${player.online || player.isAI ? '在线' : '已断线'}</span><span>${player.ready || player.isHost ? '已准备' : '未准备'}</span></div>`;
}

function renderGameTable() {
  return `<section class="game-shell"><div class="top-bar"><button class="secondary" onclick="go('home')">返回首页</button><button class="secondary" onclick="ruleIntroOpen=true;render()">规则介绍</button><span>当前模式：${state.mode === 'local' ? '单机' : '联机'}</span>${state.mode === 'online' ? `<span>房间：${state.code}</span><button class="secondary" onclick="copyRoomCode()">复制房间码</button>` : ''}${statusPills()}</div><div class="table-layout"><main class="felt-table"><div class="pot-center"><div class="deck-icon">♠</div><strong>底池 ${state.pot || 0}</strong><small>当前下注 ${state.currentBet || 0}</small></div>${renderPlayers()}</main><aside class="side-panel">${renderActions()}${renderResult()}<p class="mini-compliance">仅娱乐模拟；积分为本场临时分数，结束清零。</p><section class="panel"><h2>游戏日志</h2><div class="logs">${(state.logs || []).map((x) => `<div>${x}</div>`).join('')}</div></section></aside></div></section>`;
}

function statusPills() {
  const current = state.players.find((p) => p.id === state.currentPlayerId)?.nickname || '无';
  const left = state.players.filter((p) => !p.eliminated && !p.spectator).length;
  const hand = state.players.filter((p) => !p.eliminated && !p.spectator && !p.folded).length;
  return [`阶段：${state.phase}`, `底池：${state.pot || 0}`, `当前下注：${state.currentBet || 0}`, `行动：${current}`, `未淘汰：${left}`, `未弃牌：${hand}`].map((x) => `<span class="pill">${x}</span>`).join('');
}

function renderRuleIntroModal() {
  if (!ruleIntroOpen) return '';
  const s = state?.settings || defaultLocalSettings();
  const ps = state?.players || [];
  const items = [
    '本游戏仅为娱乐模拟，不涉及真实金钱。',
    '所有积分都是本场临时娱乐分数。',
    `初始临时积分：${s.initialPoints ?? '未设置'}；底注：${s.ante ?? '未设置'}；玩家人数：${ps.length || 0} / ${s.maxPlayers ?? '未设置'}。`,
    '每名玩家每手发 3 张牌。',
    '可操作项：看牌、跟注、加注、弃牌、比牌。',
    '牌型大小：豹子 > 顺金 > 金花 > 顺子 > 对子 > 散牌。',
    'A23 视为最小顺子。',
    'QKA 视为最大顺子。',
    '花色不参与大小比较。',
    '一手牌只剩一名未弃牌玩家时，该玩家赢得底池。',
    '玩家临时积分输光后淘汰。',
    '淘汰玩家可以选择一名玩家旁观。',
    '旁观对象选择后本场不可更改。',
    '旁观者默认不能看到未公开手牌。',
    '场上只剩一名未淘汰玩家时，整场游戏结束。',
    '整场游戏结束后所有临时积分清零。',
  ];
  return `<div class="modal-mask" onclick="ruleIntroOpen=false;render()"><section class="rule-modal" onclick="event.stopPropagation()"><div class="rule-modal-head"><h2>规则介绍</h2><button class="secondary" onclick="ruleIntroOpen=false;render()">关闭</button></div><div class="rule-intro-list">${items.map((item) => `<div class="rule done">${item}</div>`).join('')}</div></section></div>`;
}

function renderPlayers() {
  return `<section class="table players-ring">${(state.players || []).map((p) => { const hr = state.reveal?.find((r) => r.playerId === p.id); return `<div class="player ${p.current ? 'current' : ''} ${hr?.winner ? 'handWinner' : ''} ${state.gameResult?.winnerId === p.id ? 'gameWinner' : ''} ${p.eliminated ? 'eliminated' : ''}"><h3>${p.nickname} ${p.isHost ? '👑' : ''}</h3><div><span class="pill">${p.isAI ? 'AI ' + p.aiDifficulty : '真人'}</span><span class="pill">${p.online || p.isAI ? '在线' : '已断线'}</span></div><p>临时积分：${p.points} ｜ 本手投入：${p.bet}</p><p>状态：${p.spectator ? '旁观' : p.eliminated ? '已淘汰' : p.folded ? '已弃牌' : p.looked ? '已看牌' : '未看牌'} ${p.lastAction || ''}</p><div class="cards">${renderCards(p)}</div>${hr?.hand ? `<p class="ok">${hr.hand.description}</p>` : ''}</div>`; }).join('')}</section>`;
}

function renderCards(player) {
  const cards = player.cards;
  if (cards && cards.length) return cards.map((c, i) => card(c, i)).join('');
  const cls = player.folded ? 'back foldBack' : 'back';
  return [0, 1, 2].map((_, i) => `<div class="card ${cls}" style="animation-delay:${i * 80}ms"></div>`).join('');
}

function card(c, i) {
  if (!c) return `<div class="card back"></div>`;
  return `<div class="card ${c.color}" style="animation-delay:${i * 80}ms"><div class="corner">${c.rank}<br>${c.suit}</div><div class="center">${c.suit}</div><div class="bottom">${c.rank}<br>${c.suit}</div></div>`;
}

function renderActions() {
  const p = me() || {};
  const disabled = !canAct() ? 'disabled' : '';
  const targets = (state.players || []).filter((x) => x.id !== p.id && !x.eliminated && !x.spectator && !x.folded);
  const canSpectate = p.eliminated && !p.spectateTargetId;
  return `<section class="panel action-panel"><h2>操作区</h2><div class="actions"><button ${disabled} onclick="sendAction('look')">看牌</button><button ${disabled} onclick="sendAction('call')">跟注</button><input id="raiseAmount" type="number" value="${(state.currentBet || 0) + (state.settings?.ante || 50)}"><button ${disabled} onclick="sendAction('raise')">加注</button><button class="danger" ${disabled} onclick="sendAction('fold')">弃牌</button><select id="compareTarget">${targets.map((t) => `<option value="${t.id}">${t.nickname}</option>`).join('')}</select><button ${disabled || !targets.length ? 'disabled' : ''} onclick="sendAction('compare')">比牌</button></div>${canSpectate ? `<div><h3>进入旁观</h3><select id="spectateTarget">${targets.map((t) => `<option value="${t.id}">${t.nickname}</option>`).join('')}</select><button onclick="chooseSpectateTarget()">选择旁观对象</button></div>` : p.spectateTargetId ? `<p>正在旁观：${state.players.find((x) => x.id === p.spectateTargetId)?.nickname || '旁观对象已淘汰'}</p>` : ''}</section>`;
}

function renderResult() {
  if (state.phase === 'handFinished') return `<section class="panel result"><h2>本手结算</h2><p>赢家：${state.handResult?.winners?.join('、')} ｜ 底池：${state.handResult?.pot} ｜ 原因：${state.handResult?.reason}</p><ul>${(state.reveal || []).map((r) => `<li>${state.players.find((p) => p.id === r.playerId)?.nickname}：${r.hand?.description}${r.winner ? ' ✅' : ''}</li>`).join('')}</ul>${isHost() ? `<button onclick="socket.emit('nextHand')">开始下一手</button>` : ''}</section>`;
  if (state.phase === 'gameFinished') return `<section class="panel"><h2>整场游戏结束</h2><p>最终胜者：${state.gameResult?.winnerName}。所有临时积分已清零。</p>${isHost() ? `<button onclick="socket.emit('restartGame')">重新开始一场</button>` : ''}</section>`;
  return '';
}

render();
