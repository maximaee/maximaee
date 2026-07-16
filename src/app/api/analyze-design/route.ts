import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API anahtarı bulunamadı (.env.local dosyasını kontrol edin)." },
        { status: 500 }
      );
    }

    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Resim URL'si gerekli" }, { status: 400 });
    }

    const prompt = `
You are an expert UI/UX developer and CSS architect. Analyze the provided bank login page image and extract its design properties into a strictly formatted JSON object.
DO NOT wrap the response in markdown blocks (like \`\`\`json). Return ONLY the raw JSON object.

The JSON MUST match this exact schema:
{
  "layout": "centered" | "split-left" | "split-right" | "full-width",
  "blocks": ["header", "spacer", "form", "spacer", "footer"], // order them as they appear vertically
  "background": {
    "type": "color" | "image",
    "value": "string (HEX color or 'image' if it's a photo)"
  },
  "header": {
    "show": boolean,
    "backgroundColor": "string (HEX)",
    "height": "string (e.g., '80px')",
    "logoAlignment": "left" | "center" | "right",
    "padding": "string"
  },
  "formBox": {
    "backgroundColor": "string (HEX)",
    "textColor": "string (HEX)",
    "borderRadius": "string (e.g., '8px')",
    "boxShadow": "none" | "sm" | "md" | "lg",
    "padding": "string (e.g., '2rem')",
    "width": "string (e.g., '400px')",
    "alignment": "left" | "center" | "right"
  },
  "button": {
    "backgroundColor": "string (HEX)",
    "hoverColor": "string (HEX)",
    "textColor": "string (HEX)",
    "borderRadius": "string (e.g., '4px')",
    "padding": "string",
    "fontWeight": "string"
  },
  "typography": {
    "fontFamily": "string",
    "headerColor": "string (HEX)",
    "bodyColor": "string (HEX)",
    "linkColor": "string (HEX)"
  },
  "texts": {
    "title": "string (The main login header)",
    "subtitle": "string (The secondary text below the header)",
    "footerLinks": ["string"]
  }
}

Analyze the image carefully:
- If the form is on the right side and an image is on the left, layout is "split-right".
- Extract exact HEX colors for buttons, backgrounds, and text.
- Extract the actual Dutch text you see for title and subtitle.
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
      max_tokens: 1000,
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
