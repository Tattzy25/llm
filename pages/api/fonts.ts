import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_FONTS_API_KEY is not configured' });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`
    );
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }
    const data = await response.json();
    // Return only family names
    const families = data.items.map((item: any) => item.family);
    res.status(200).json({ families });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
