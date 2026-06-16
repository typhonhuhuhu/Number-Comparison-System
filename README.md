# 炸金花娱乐模拟器（纯前端 + Firebase 版）

一个可以部署到 GitHub Pages / Vercel / Netlify 的炸金花规则娱乐模拟器。项目使用 **HTML + CSS + JavaScript + Firebase Realtime Database**，不再需要 Node.js、Express、Socket.IO、Render 或任何自建服务端。

> 合规声明：本游戏仅为扑克牌规则娱乐模拟，不涉及真实金钱、充值、提现、兑换、奖励或任何形式的赌博行为。所有积分仅为本场临时娱乐分数，游戏结束后自动清零。

## 特点

- 首页封面、单机模式、联机模式、房间大厅、游戏桌面。
- 单机模式可快速开始，自动补 AI。
- 联机模式使用 Firebase Realtime Database 同步房间状态。
- 创建房间、复制房间码、加入房间、房主开始、AI 补位。
- 支持看牌、跟注、加注、弃牌、比牌、淘汰、旁观、结算清零。
- 不做防作弊：为了方便静态部署，房间状态、牌堆和玩家手牌会存储在 Firebase 房间数据中。
- 不保存账户、余额、长期积分、排行榜、战绩或任何现实利益。

## 项目结构

```text
.
├── index.html
├── style.css
├── app.js
├── firebase-config.example.js
├── README.md
├── LICENSE
└── .gitignore
```

## 本地预览

可以直接用浏览器打开 `index.html` 体验单机模式。

联机模式需要先配置 Firebase，并建议用任意静态服务器打开，例如 VS Code Live Server、Python 简单服务器或 Vercel 本地预览。

## Firebase 配置步骤

1. 打开 <https://console.firebase.google.com/> 并创建项目。
2. 在项目中添加一个 Web App。
3. 开启 **Realtime Database**。
4. 测试阶段可使用如下数据库规则（正式使用请自行收紧）：

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

5. 复制 `firebase-config.example.js` 为 `firebase-config.js`。
6. 将 Firebase 控制台提供的配置填入 `firebase-config.js`：

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

7. 确保 `index.html` 能加载 `firebase-config.js`。

## 部署到 GitHub Pages

1. 将项目上传到 GitHub。
2. 在仓库 Settings → Pages 中选择分支和根目录。
3. 确保仓库中包含你自己的 `firebase-config.js`（如果公开仓库不想暴露配置，可使用 Vercel 环境变量方式自行改造）。
4. 打开 Pages 网址即可使用。

## 部署到 Vercel / Netlify

1. 导入该静态项目。
2. 构建命令留空。
3. 输出目录选择项目根目录。
4. 部署后访问公开网址。


## Firebase 房间数据结构

联机房间状态写入 Realtime Database：

```text
rooms/{roomCode} = {
  roomCode,
  phase,
  settings,
  players,
  deck,
  pot,
  currentBet,
  currentPlayerId,
  logs,
  handResult,
  gameResult,
  createdAt,
  updatedAt
}
```

房主客户端负责洗牌、发牌、结算和更新房间状态。为了方便静态部署，本项目不做防作弊，客户端可以持有完整牌面和房间状态。

## 联机使用流程

1. 玩家 A 打开网页，进入“联机模式”。
2. 创建房间并复制房间码。
3. 玩家 B 打开同一个网址，输入房间码加入。
4. 房主点击开始游戏或 AI 补位后开始。
5. 所有客户端通过 Firebase 实时同步房间状态。

## 注意事项

- 本版本不使用 Render，不需要 Node.js 服务端，也不要运行 `npm install` / `npm start`。
- 本版本不防作弊，适合朋友娱乐、规则演示和低成本部署。
- Firebase 免费额度和数据库规则由项目部署者自行管理。
- 所有积分都是当前房间当前场次内的临时娱乐分数，不具有任何现实价值。
