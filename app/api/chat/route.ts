import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const result = streamText({
    model: 'openai/gpt-4o', // Updated to available model
    prompt,
  });

  // Create a ReadableStream from the textStream
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.textStream) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
