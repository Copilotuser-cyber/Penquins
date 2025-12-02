// api/whisperer.js
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;
  if (!HF_TOKEN) {
    console.error("❌ HUGGING_FACE_TOKEN is missing in Vercel environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const { prompt } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.length > 200) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // ✅ CORRECT ENDPOINT: https://api-inference.huggingface.co (still works for inference!)
    // The "router" error is misleading - the old endpoint works for inference
    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `A penguin expert answering: "${prompt}"`,
          parameters: {
            max_new_tokens: 80,
            temperature: 0.8,
            top_p: 0.9,
            repetition_penalty: 1.1
          }
        })
      }
    );

    // Handle Hugging Face errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face API error:", response.status, errorText);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: "Invalid Hugging Face token. Please contact the site administrator." 
        });
      }
      
      if (response.status === 503) {
        return res.status(503).json({ 
          error: "Penguin wisdom is loading... Please try again in 30 seconds." 
        });
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    // Parse response
    const result = await response.json();
    let text = "";

    if (Array.isArray(result) && result[0]?.generated_text) {
      text = result[0].generated_text;
    } else if (typeof result === 'object' && result.generated_text) {
      text = result.generated_text;
    }

    // Clean and validate
    text = text
      .replace(/A penguin expert answering:.+?"(.+?)"/, '$1') // Extract quoted answer
      .replace(/"/g, '') // Remove quotes
      .trim();

    if (!text || text.length < 10) {
      text = "Penguins are incredible birds! They can't fly but swim up to 22 mph underwater.";
    }

    // Log success
    console.log("✅ Whisperer responded:", text.substring(0, 50) + "...");
    
    // Return to client
    res.status(200).json({ response: text });

  } catch (error) {
    console.error("🔥 Fatal error in whisperer:", error);
    res.status(500).json({ 
      error: "The penguin council is in session. Please try again shortly." 
    });
  }
}
