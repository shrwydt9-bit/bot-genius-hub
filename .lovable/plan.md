
# خطة تنفيذ شاملة: Ultimate Edition - Multi-Platform AI System with OpenRouter

## 🎯 الهدف الرئيسي
تحويل المنصة بالكامل من استخدام Lovable AI Gateway (Gemini) إلى OpenRouter SDK مع إضافة دعم لجميع منصات التواصل الاجتماعي والرسائل العالمية.

---

## 📋 المرحلة الأولى: استبدال نظام الذكاء الاصطناعي

### 1.1 تثبيت التبعيات الجديدة
**الملفات المتأثرة:** `package.json`

- إضافة `@openrouter/sdk` version `^1.0.0`
- إزالة أي تبعيات خاصة بـ Lovable AI (إن وجدت)

### 1.2 إضافة مفتاح OpenRouter API
**الملفات المتأثرة:** Supabase Secrets

- طلب من المستخدم إدخال `OPENROUTER_API_KEY` عبر أداة إضافة الأسرار
- حذف استخدام `LOVABLE_API_KEY` من جميع Edge Functions

### 1.3 إنشاء مكتبة OpenRouter مشتركة
**ملف جديد:** `supabase/functions/_shared/openrouter.ts`

```typescript
import OpenRouter from "@openrouter/sdk";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function createOpenRouterClient() {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  return new OpenRouter({ apiKey });
}

export async function streamChatCompletion(
  client: OpenRouter,
  model: string,
  messages: ChatMessage[],
  onChunk: (content: string) => void
) {
  const stream = await client.chat.send({
    model,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) onChunk(content);
  }
}

export async function chatCompletion(
  client: OpenRouter,
  model: string,
  messages: ChatMessage[],
  tools?: any[]
) {
  const response = await client.chat.send({
    model,
    messages,
    tools,
    stream: false,
  });
  return response.choices[0]?.message;
}
```

### 1.4 تحديث Edge Functions
**الملفات المتأثرة:**
- `supabase/functions/bot-chat/index.ts`
- `supabase/functions/ecommerce-bot-chat/index.ts`
- `supabase/functions/ai-suggestions/index.ts`
- `supabase/functions/webhook-whatsapp/index.ts`
- `supabase/functions/webhook-telegram/index.ts`

**التغييرات المطلوبة:**

1. استبدال كل `fetch("https://ai.gateway.lovable.dev/v1/chat/completions")` بـ OpenRouter SDK
2. استبدال `const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")` بـ `createOpenRouterClient()`
3. استخدام النماذج الجديدة:
   - `tngtech/deepseek-r1t2-chimera:free` (للمحادثات العامة)
   - `xiaomi/mimo-v2-flash:free` (للاستجابات السريعة)
4. تحديث معالجة الأخطاء لتتناسب مع OpenRouter API

**مثال على التحديث في `bot-chat/index.ts`:**

```typescript
import { createOpenRouterClient, streamChatCompletion } from "../_shared/openrouter.ts";

// استبدال fetch بـ:
const client = await createOpenRouterClient();

// للـ streaming:
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    await streamChatCompletion(
      client,
      "tngtech/deepseek-r1t2-chimera:free",
      [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      (chunk) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: chunk } }]
        })}\n\n`));
      }
    );
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
  },
});

return new Response(stream, {
  headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
});
```

### 1.5 تحديث Frontend Streaming
**الملفات المتأثرة:** `src/lib/streamChat.ts`

- تحديث parsing logic للتأكد من توافقه مع OpenRouter streaming format
- التأكد من معالجة الأخطاء بشكل صحيح

---

## 📋 المرحلة الثانية: توسيع دعم المنصات

### 2.1 تحديث قاعدة البيانات
**ملف Migration جديد:** `supabase/migrations/[timestamp]_add_all_platforms.sql`

```sql
-- تحديث ENUM للمنصات لتشمل جميع المنصات العالمية
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'email';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'sms';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'linkedin';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'tiktok';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'discord';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'microsoft_teams';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'twitter';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'snapchat';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'wechat';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'line';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'viber';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'pinterest';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'reddit';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'youtube';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'google_business';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'apple_messages';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'rcs';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'kik';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'signal';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'matrix';

-- جدول لتكوينات المنصات الخاصة
CREATE TABLE IF NOT EXISTS platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  credentials JSONB NOT NULL, -- API keys, tokens, etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
  ON platform_integrations
  FOR ALL
  USING (auth.uid() = user_id);
```

### 2.2 إنشاء Webhook Handlers الجديدة

**ملفات جديدة:** (20+ ملف)

1. `supabase/functions/webhook-email/index.ts` - SendGrid/Resend webhooks
2. `supabase/functions/webhook-sms/index.ts` - Twilio SMS
3. `supabase/functions/webhook-linkedin/index.ts` - LinkedIn messaging
4. `supabase/functions/webhook-tiktok/index.ts` - TikTok comments/DMs
5. `supabase/functions/webhook-discord/index.ts` - Discord bot
6. `supabase/functions/webhook-teams/index.ts` - Microsoft Teams
7. `supabase/functions/webhook-twitter/index.ts` - Twitter/X DMs
8. `supabase/functions/webhook-snapchat/index.ts` - Snapchat
9. `supabase/functions/webhook-wechat/index.ts` - WeChat
10. `supabase/functions/webhook-line/index.ts` - Line messaging
11. `supabase/functions/webhook-viber/index.ts` - Viber
12. `supabase/functions/webhook-pinterest/index.ts` - Pinterest comments
13. `supabase/functions/webhook-reddit/index.ts` - Reddit bot
14. `supabase/functions/webhook-youtube/index.ts` - YouTube comments
15. `supabase/functions/webhook-google-business/index.ts` - Google Business Messages
16. `supabase/functions/webhook-apple-messages/index.ts` - Apple Messages for Business
17. `supabase/functions/webhook-rcs/index.ts` - RCS messaging
18. `supabase/functions/webhook-kik/index.ts` - Kik messenger
19. `supabase/functions/webhook-signal/index.ts` - Signal (via bot API)
20. `supabase/functions/webhook-matrix/index.ts` - Matrix protocol

**هيكل موحد لكل webhook:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenRouterClient, chatCompletion } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. التحقق من الـ webhook signature (خاص بكل منصة)
    // 2. استخراج الرسالة من payload المنصة
    // 3. البحث عن deployment configuration
    // 4. استخدام OpenRouter للرد
    // 5. إرسال الرد عبر API المنصة
    // 6. تسجيل في webhook_logs
    
    // Implementation specific to each platform...
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 2.3 تحديث `supabase/config.toml`

```toml
[functions.webhook-email]
verify_jwt = false

[functions.webhook-sms]
verify_jwt = false

[functions.webhook-linkedin]
verify_jwt = false

[functions.webhook-tiktok]
verify_jwt = false

# ... (كرر لكل منصة جديدة)
```

---

## 📋 المرحلة الثالثة: تحديث واجهة المستخدم

### 3.1 توسيع بيانات المنصات
**الملفات المتأثرة:** 
- `src/pages/Platforms.tsx`
- `src/components/PlatformGrid.tsx`

**إضافة جميع المنصات الجديدة:**

```typescript
const allPlatforms = [
  // Messaging Apps
  { name: "WhatsApp", icon: MessageCircle, color: "hsl(142 71% 45%)", category: "Messaging" },
  { name: "Telegram", icon: Send, color: "hsl(200 100% 50%)", category: "Messaging" },
  { name: "Signal", icon: Shield, color: "hsl(210 100% 45%)", category: "Messaging" },
  { name: "WeChat", icon: MessageSquare, color: "hsl(120 100% 35%)", category: "Messaging" },
  { name: "Line", icon: MessageCircle, color: "hsl(142 90% 45%)", category: "Messaging" },
  { name: "Viber", icon: Phone, color: "hsl(270 70% 55%)", category: "Messaging" },
  { name: "Kik", icon: MessageSquare, color: "hsl(110 60% 50%)", category: "Messaging" },
  
  // Social Media
  { name: "Instagram", icon: Instagram, color: "hsl(340 75% 55%)", category: "Social Media" },
  { name: "Facebook", icon: Facebook, color: "hsl(220 89% 51%)", category: "Social Media" },
  { name: "Twitter/X", icon: Twitter, color: "hsl(203 89% 53%)", category: "Social Media" },
  { name: "LinkedIn", icon: Linkedin, color: "hsl(201 100% 35%)", category: "Social Media" },
  { name: "TikTok", icon: Music, color: "hsl(0 0% 0%)", category: "Social Media" },
  { name: "Snapchat", icon: Camera, color: "hsl(50 100% 50%)", category: "Social Media" },
  { name: "Pinterest", icon: Image, color: "hsl(0 78% 45%)", category: "Social Media" },
  { name: "Reddit", icon: MessageSquare, color: "hsl(16 100% 50%)", category: "Social Media" },
  { name: "YouTube", icon: Video, color: "hsl(0 100% 50%)", category: "Social Media" },
  
  // Business Communication
  { name: "Slack", icon: Slack, color: "hsl(185 90% 39%)", category: "Business" },
  { name: "Microsoft Teams", icon: Users, color: "hsl(232 76% 55%)", category: "Business" },
  { name: "Discord", icon: Hash, color: "hsl(235 86% 65%)", category: "Business" },
  { name: "Matrix", icon: Grid, color: "hsl(155 90% 39%)", category: "Business" },
  
  // Direct Channels
  { name: "Email", icon: Mail, color: "hsl(210 100% 50%)", category: "Direct" },
  { name: "SMS", icon: MessageSquare, color: "hsl(142 71% 45%)", category: "Direct" },
  { name: "RCS", icon: MessageCircle, color: "hsl(220 89% 51%)", category: "Direct" },
  
  // Business Messaging
  { name: "Google Business", icon: Building, color: "hsl(217 89% 61%)", category: "Business Messaging" },
  { name: "Apple Messages", icon: Apple, color: "hsl(0 0% 20%)", category: "Business Messaging" },
  
  // E-commerce
  { name: "Shopify", icon: ShoppingBag, color: "hsl(149 59% 48%)", category: "E-commerce" },
];
```

### 3.2 إنشاء مكونات إعداد المنصة
**ملف جديد:** `src/components/PlatformSetup.tsx`

```typescript
// مكون شامل لإعداد أي منصة مع تعليمات تفصيلية
// دعم لرفع credentials (API keys, tokens, webhooks)
// تحقق من صحة الاتصال
// اختبار إرسال رسالة تجريبية
```

### 3.3 إنشاء لوحة تحكم للمنصات
**ملف جديد:** `src/pages/PlatformManager.tsx`

- عرض جميع المنصات المتصلة
- إمكانية تفعيل/إيقاف كل منصة
- عرض الإحصائيات لكل منصة
- إدارة الـ credentials

### 3.4 تحديث نظام الـ Deployment
**الملفات المتأثرة:**
- `src/components/DeploymentCard.tsx`
- أي صفحة تتعامل مع deployments

**إضافة:**
- أيقونات مخصصة لكل منصة
- تعليمات إعداد مفصلة لكل منصة
- اختبار webhook لكل منصة

---

## 📋 المرحلة الرابعة: تحسينات متقدمة

### 4.1 نظام Template للردود
**ملف جديد:** `src/components/ResponseTemplates.tsx`

- إنشاء قوالب ردود جاهزة لكل منصة
- دعم المتغيرات الديناميكية
- معاينة قبل النشر

### 4.2 Multi-Brand Support المتقدم
**الملفات المتأثرة:** جدول `brands`

- ربط كل brand بمجموعة من المنصات
- تخصيص الـ personality لكل منصة
- إدارة الـ credentials على مستوى البراند

### 4.3 Analytics متقدمة
**الملفات المتأثرة:** `src/pages/Analytics.tsx`

**إضافة:**
- تقارير مقارنة بين المنصات
- معدلات التفاعل لكل منصة
- أفضل أوقات الإرسال
- تحليل المشاعر للرسائل
- معدلات التحويل لكل منصة

### 4.4 AI Insights للمنصات
**تحديث:** `supabase/functions/ai-suggestions/index.ts`

**إضافة اقتراحات خاصة بالمنصات:**
- "منصة LinkedIn تحقق أفضل engagement في ساعات العمل"
- "TikTok bot يحتاج استجابات أقصر وأسرع"
- "Email campaigns تحتاج subject lines أفضل"

---

## 📋 المرحلة الخامسة: الاختبار والنشر

### 5.1 اختبارات الوحدة
**ملفات جديدة:** `src/test/platforms/*.test.ts`

- اختبار كل webhook handler
- اختبار parsing للرسائل من كل منصة
- اختبار معالجة الأخطاء

### 5.2 اختبارات التكامل
- اختبار النظام بالكامل مع منصات حقيقية (sandbox/test accounts)
- التأكد من streaming يعمل بشكل صحيح
- التحقق من تسجيل الأحداث في analytics

### 5.3 التوثيق
**ملفات جديدة:**
- `docs/PLATFORM_SETUP.md` - دليل إعداد كل منصة
- `docs/API_MIGRATION.md` - دليل الانتقال من Lovable AI إلى OpenRouter
- `docs/WEBHOOK_DEVELOPMENT.md` - دليل تطوير webhooks جديدة

---

## 🔧 التفاصيل التقنية

### استخدام OpenRouter SDK

**النماذج المتاحة:**
1. **tngtech/deepseek-r1t2-chimera:free**
   - مجاني
   - ممتاز للمحادثات المعقدة
   - يدعم reasoning chains
   - استخدام: المحادثات العامة، customer support

2. **xiaomi/mimo-v2-flash:free**
   - مجاني
   - سريع جداً
   - مناسب للاستجابات القصيرة
   - استخدام: الردود السريعة، chatbots بسيطة

**مثال الاستخدام:**

```typescript
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: Deno.env.get("OPENROUTER_API_KEY")
});

// Streaming
const stream = await openrouter.chat.send({
  model: "tngtech/deepseek-r1t2-chimera:free",
  messages: [
    { role: "user", content: "Hello" }
  ],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    // Handle chunk
  }
}

// Non-streaming
const response = await openrouter.chat.send({
  model: "xiaomi/mimo-v2-flash:free",
  messages: [
    { role: "user", content: "Quick question" }
  ]
});
```

### معالجة Webhooks المتقدمة

**تحديات كل منصة:**

1. **WhatsApp Business**: Hub verification, message templates
2. **Telegram**: Inline keyboards, bot commands
3. **Discord**: Slash commands, embeds
4. **LinkedIn**: OAuth authentication
5. **TikTok**: Comment moderation
6. **Email**: MIME parsing, spam filtering
7. **SMS**: Character limits, delivery reports
8. **Twitter/X**: Rate limiting, thread handling

### نظام Credentials الآمن

```typescript
// تشفير credentials قبل التخزين
interface PlatformCredentials {
  platform: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  additionalConfig?: Record<string, any>;
}

// تخزين في platform_integrations.credentials (JSONB encrypted)
```

---

## 📊 الجدول الزمني المقترح

1. **المرحلة الأولى (استبدال AI)**: 2-3 أيام
2. **المرحلة الثانية (إضافة المنصات)**: 5-7 أيام
3. **المرحلة الثالثة (تحديث UI)**: 3-4 أيام
4. **المرحلة الرابعة (التحسينات)**: 2-3 أيام
5. **المرحلة الخامسة (الاختبار)**: 2-3 أيام

**إجمالي: 14-20 يوم عمل**

---

## ⚠️ المخاطر والتحديات

### تقنية:
1. **Rate Limits**: كل منصة لها حدود مختلفة
2. **Authentication**: OAuth flows معقدة لبعض المنصات
3. **Webhook Reliability**: retry logic وإدارة الفشل
4. **Cost**: OpenRouter مجاني لكن قد يكون له قيود

### تجارية:
1. **Platform Policies**: بعض المنصات تحظر البوتات
2. **Compliance**: GDPR, data retention policies
3. **Platform API Changes**: قد تتغير APIs بدون تحذير

### حلول:
- تنفيذ retry logic قوي
- تخزين message queue للفشل
- مراقبة صحة الـ webhooks
- تحديثات دورية لدعم API changes
- logs تفصيلية لكل منصة

---

## 🎨 التحسينات الإضافية

### UI/UX:
- Dark mode optimization لكل منصة
- Responsive design للموبايل
- Real-time status indicators
- Drag-and-drop platform ordering

### Features:
- A/B testing للردود
- Scheduled messages
- Auto-translation لـ multilingual support
- Voice message support (WhatsApp, Telegram)
- Rich media support (images, videos, files)

### Analytics:
- Conversion funnels
- Customer journey mapping
- Sentiment analysis
- Predictive analytics

---

## 📝 ملاحظات هامة

1. **Backwards Compatibility**: الحفاظ على دعم Gemini مؤقتاً خلال الانتقال
2. **Migration Strategy**: نقل تدريجي للمستخدمين الحاليين
3. **Fallback System**: الرجوع لـ Gemini إذا فشل OpenRouter
4. **Documentation**: توثيق شامل لكل تغيير

---

## 🚀 الخطوات التالية للبدء

بعد الموافقة على هذه الخطة، سأبدأ بـ:

1. ✅ إضافة `@openrouter/sdk` للـ dependencies
2. ✅ طلب `OPENROUTER_API_KEY` من المستخدم
3. ✅ إنشاء `_shared/openrouter.ts` library
4. ✅ تحديث أول Edge Function (bot-chat) كـ proof of concept
5. ✅ اختبار النظام الجديد
6. ✅ المتابعة مع باقي المراحل

هل توافق على هذه الخطة؟ هل تريد تعديل أي جزء أو البدء مباشرة؟
