export const config = { runtime: 'edge' };

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  const { url, targetLang } = await req.json();
  if (!url || !targetLang) {
    return new Response(JSON.stringify({ error: 'url و targetLang مطلوبان' }), { status: 400, headers: corsHeaders });
  }

  const platforms = {
    'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
    'facebook.com': 'Facebook', 'fb.watch': 'Facebook',
    'instagram.com': 'Instagram', 'tiktok.com': 'TikTok',
    'twitter.com': 'Twitter', 'x.com': 'X/Twitter',
    'vimeo.com': 'Vimeo', 'dailymotion.com': 'Dailymotion'
  };
  const platform = Object.entries(platforms).find(([k]) => url.includes(k))?.[1] || 'فيديو';
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const prompt = `أنت مساعد ترجمة ذكي. المستخدم أرسل رابط فيديو من ${platform}: ${url}
يريد ترجمته إلى: ${targetLang.name} (${targetLang.code})

اكتب ردًا مفيدًا يتضمن:
1. تأكيد استلام الرابط وتحديد المنصة
2. اقتراحات عملية فورية:
   ${isYouTube ? '- تفعيل الترجمة التلقائية في YouTube وتغيير اللغة' : '- استخدام CapCut أو Kapwing'}
   - موقع downsub.com لتحميل ترجمات YouTube
   - أداة Whisper من OpenAI مجانية
3. جملة تشجيعية

اكتب بالعربية بشكل ودود.`;

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
    return new Response(JSON.stringify({ error: err.error?.message || 'خطأ من Groq API' }), { status: 500, headers: corsHeaders });
  }

  const data = await response.json();
  const translation = data.choices?.[0]?.message?.content || 'لم يتم الحصول على رد';

  return new Response(JSON.stringify({
    translation,
    videoTitle: `فيديو من ${platform}`,
    duration: 'غير محدد',
    originalLanguage: 'اللغة الأصلية'
  }), { status: 200, headers: corsHeaders });
}
