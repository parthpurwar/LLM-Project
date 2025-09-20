import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import z from 'zod';
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello World! Visit /api/hello for a message.' });
});

const conversations = new Map<string, string>();

const chatSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required.')
    .max(1000, 'Prompt is too long.'),
  convesrationId: z.string().uuid(),
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const parseResult = chatSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.format() });
    return;
  }

  try {
    const { prompt, convesrationId } = req.body;
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 100,
      previous_response_id: conversations.get(convesrationId),
    });
    conversations.set(convesrationId, response.id);
    res.json({ message: response.output_text });
  } catch (error: any) {
    console.error('Error communicating with OpenAI:', error);
    if (error.status == 429) {
      res
        .status(429)
        .json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    } else {
      res.status(500).json({ error: 'Failed to generate a valid response' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
