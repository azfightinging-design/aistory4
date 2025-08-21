// 简易服务端代理，解决 CORS 并隐藏密钥
require('dotenv').config();
const express = require('express');
const cors = require('cors');
let fetchImpl = globalThis.fetch;
if (!fetchImpl) {
	try {
		fetchImpl = require('undici').fetch;
		console.log('[INFO] 使用 undici 提供的 fetch');
	} catch (e) {
		console.warn('[WARN] 未找到全局 fetch 或 undici，Node 18+ 才内置 fetch');
	}
}

const app = express();
const PORT = process.env.PORT || 3000;
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY;

if (!ARK_API_KEY) {
	console.warn('[WARN] 未检测到环境变量 ARK_API_KEY，第三方接口将无法调用。请在启动前设置：export ARK_API_KEY=你的密钥');
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 静态资源（将前端通过同源方式提供，避免 origin:null）
app.use(express.static(__dirname));

// 文本大模型转发
app.post('/api/chat', async (req, res) => {
	try {
		if (!ARK_API_KEY) {
			return res.status(500).json({ error: 'Server missing ARK_API_KEY' });
		}
		const upstream = await fetchImpl(`${ARK_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ARK_API_KEY}`
			},
			body: JSON.stringify(req.body)
		});
		const text = await upstream.text();
		res.status(upstream.status);
		try {
			res.type('application/json').send(JSON.parse(text));
		} catch {
			res.send(text);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Proxy error' });
	}
});

// 图片生成转发
app.post('/api/images', async (req, res) => {
	try {
		if (!ARK_API_KEY) {
			return res.status(500).json({ error: 'Server missing ARK_API_KEY' });
		}
		const upstream = await fetchImpl(`${ARK_BASE_URL}/images/generations`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${ARK_API_KEY}`
			},
			body: JSON.stringify(req.body)
		});
		const text = await upstream.text();
		res.status(upstream.status);
		try {
			res.type('application/json').send(JSON.parse(text));
		} catch {
			res.send(text);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Proxy error' });
	}
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});


