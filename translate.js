export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, targetLang } = req.body || {};
  if (!url || !targetLang) return res.status(400).json({ error: 'url و targetLang مطلوبان' });

  const platforms = {
    'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
    'facebook.com': 'Facebook', 'fb.watch': 'Facebook',
    'instagram.com': 'Instagram', 'tiktok.com': 'TikTok',
    'twitter.com': 'Twitter', 'x.com': 'X/Twitter',
    'vimeo.com': 'Vimeo', 'dailymotion.com': 'Dailymotion'
  };
  const platform = Object.entries(platforms).find(([k]) => url.includes(k))?.[1] || 'فيديو';
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const prompt = `أنت مساعد ترجمة ذكي ومتخصص في محتوى الفيديو.

المستخدم أرسل رابط فيديو من ${platform}: ${url}
يريد ترجمته إلى: ${targetLang.name} (${targetLang.code})

اكتب ردًا مفيدًا يتضمن:
1. تأكيد استلام الرابط وتحديد المنصة
2. اقتراحات عملية فورية لترجمة هذا الفيديو:
   ${isYouTube ? '- تفعيل الترجمة التلقائية في YouTube وتغيير اللغة' : '- استخدام CapCut أو Kapwing'}
   - موقع downsub.com لتحميل ترجمات YouTube
   - أداة Whisper من OpenAI مجانية للترجمة المحلية
3. جملة تشجيعية

اكتب بالعربية، بشكل ودود ومنظم.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.error?.message || 'خطأ من Groq API' });
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content || 'لم يتم الحصول على رد';

    return res.status(200).json({
      translation,
      videoTitle: `فيديو من ${platform}`,
      duration: 'غير محدد',
      originalLanguage: 'اللغة الأصلية'
    });

  } catch (err) {
    return res.status(500).json({ error: 'خطأ داخلي: ' + err.message });
  }
}
