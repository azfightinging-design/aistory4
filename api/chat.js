// Vercel 无服务器函数：转发聊天补全
export default async function handler(req, res) {
  // CORS 处理，允许跨域（含 file:// 源，浏览器会显示 origin:null）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const ARK_API_KEY = process.env.ARK_API_KEY;
  if (!ARK_API_KEY) {
    return res.status(500).json({ error: 'Missing ARK_API_KEY' });
  }
  try {
    const upstream = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
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
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (e) {
    res.status(500).json({ error: 'Proxy error' });
  }
}


