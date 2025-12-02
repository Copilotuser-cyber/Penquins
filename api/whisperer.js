// api/whisperer.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;
  if (!HF_TOKEN) {
    console.error("❌ HUGGING_FACE_TOKEN missing in Vercel env vars");
    return res.status(500).json({ error: "Server config error" });
  }

  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.length > 200) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // ✅ USE THE NEW ROUTER ENDPOINT
    const MODEL = "meta-llama/Llama-4-Scout-17B-16E-Instruct"; // Still works via router
    
    const response = await fetch(
      `https://router.huggingface.co/models/${MODEL}/generate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `User: ${prompt}\nBot:`,
          parameters: {
            max_new_tokens: 80,
            temperature: 0.9,
            top_p: 0.95,
            repetition_penalty: 1.2
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face error:", response.status, errorText);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: "Invalid token. Please contact site admin." 
        });
      }
      if (response.status === 503) {
        return res.status(503).json({ 
          error: "Model loading... Wait 30 seconds and retry." 
        });
      }
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    let text = "";

    if (result?.generated_text) {
      text = result.generated_text;
    } else if (Array.isArray(result) && result[0]?.generated_text) {
      text = result[0].generated_text;
    }

    // Clean response
    text = text
      .replace(/User:.+?Bot:/g, '')
      .trim();

    if (!text || text.length < 10) {
      text = "Penguins are incredible birds! They can't fly but swim up to 22 mph underwater.";
    }

    console.log("✅ Response:", text.substring(0, 50) + "...");
    res.status(200).json({ response: text });

  } catch (error) {
    console.error("🔥 Fatal error:", error.message);
    res.status(500).json({ 
      error: "The penguin council is in session. Please try again shortly." 
    });
  }
}
