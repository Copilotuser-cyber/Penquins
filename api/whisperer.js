// api/whisperer.js
import { HfInference } from '@huggingface/inference';

const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

if (!HF_TOKEN) {
  console.error("❌ HUGGING_FACE_TOKEN not set in Vercel environment variables");
  throw new Error("Server misconfiguration");
}

const hf = new HfInference(HF_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.length > 200) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // Use a more reliable model that works out-of-the-box
    const response = await hf.textGeneration({
      model: "meta-llama/Llama-4-Scout-17B-16E-Instruct", // More stable than blenderbot
      inputs: `User: ${prompt}\nBot:`,
      parameters: {
        max_new_tokens: 80,
        temperature: 0.9,
        top_p: 0.95,
        repetition_penalty: 1.2,
        return_full_text: false
      }
    });

    let text = response.generated_text || "";
    
    // Clean response
    text = text
      .split('\n')[0] // Take only first line
      .replace(/User:.*/gi, '')
      .replace(/Bot:/gi, '')
      .trim();

    if (!text || text.length < 5) {
      text = "Penguins are fascinating birds that can't fly but are amazing swimmers!";
    }

    console.log("✅ Whisperer response:", text);
    res.status(200).json({ response: text });

  } catch (error) {
    console.error("🔥 Whisperer error:", error.message || error);
    
    // Log specific Hugging Face errors
    if (error.message?.includes("Authorization")) {
      console.error("🔑 HUGGING_FACE_TOKEN is invalid or missing!");
    }
    
    res.status(500).json({ 
      error: "The penguin elders are in deep meditation. Please try again in a moment." 
    });
  }
}
