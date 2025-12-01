// api/whisperer.js
import { HfInference } from '@huggingface/inference';

// Get token from Vercel environment variable
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;
const MODEL = "google/flan-t5-large";

if (!HF_TOKEN) {
  throw new Error("HUGGING_FACE_TOKEN environment variable is not set");
}

const hf = new HfInference(HF_TOKEN);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // Format prompt for penguin context
    const formattedPrompt = `penguin: ${prompt}`;

    // Query Hugging Face
    const response = await hf.textGeneration({
      model: MODEL,
      inputs: formattedPrompt,
      parameters: {
        max_new_tokens: 120,
        temperature: 0.85,
        top_p: 0.95,
        repetition_penalty: 1.2,
        return_full_text: false
      }
    });

    // Clean response
    let text = response.generated_text || "";
    text = text
      .replace(/penguin:.+?(?=\n|$)/gi, '')
      .replace(/Bot:/gi, '')
      .replace(/^"(.*)"$/, '$1')
      .trim();

    if (!text) {
      text = "The penguins are sharing their secrets in hushed tones...";
    }

    res.status(200).json({ response: text });
  } catch (error) {
    console.error("Whisperer error:", error);
    res.status(500).json({ 
      error: "The penguins are sleeping right now. Try again later." 
    });
  }
}
