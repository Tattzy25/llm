import { streamText } from 'ai';
import 'dotenv/config'; // Makes AI_GATEWAY_API_KEY available

async function main() {
  const result = streamText({
    model: 'openai/gpt-4o', // Replace as needed
    prompt: 'How does Vercel AI Gateway work?',
  });

  for await (const part of result.textStream) {
    process.stdout.write(part);
  }
  console.log('\nToken usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
}

main().catch(console.error);
