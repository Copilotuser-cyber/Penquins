export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prompt = req.body?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt in request body" });
  }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prompt = req.body?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt in request body" });
  }

  try {
    const hfResponse = await fetch("https://router.huggingface.co/models/meta-llama/Llama-4-Scout-17B-16E-Instruct", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const text = await hfResponse.text(); // Read raw response first

    if (!hfResponse.ok) {
      console.error("Hugging Face error:", text);
      return res.status(hfResponse.status).json({ error: text });
    }

    const result = JSON.parse(text); // Only parse if response is OK
    res.status(200).json(result);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

  try {
    const hfResponse = await fetch("https://router.huggingface.co/models/meta-llama/Llama-4-Scout-17B-16E-Instruct", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    const result = await hfResponse.json();

    if (!hfResponse.ok) {
      console.error("Hugging Face API error:", result);
      return res.status(hfResponse.status).json({ error: result });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
