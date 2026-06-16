export const FALLBACK_MODEL = 'gpt-4o-mini'

export function extractOutputText(response: any): string {
  if (typeof response.output_text === 'string') return response.output_text
  const pieces: string[] = []
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') pieces.push(content.text)
    }
  }
  return pieces.join('\n')
}

type JsonSchemaFormat = {
  name: string
  schema: Record<string, unknown>
}

// Calls the OpenAI Responses API with strict JSON-schema output. Returns null on
// missing API key, request failure, or any thrown error — callers fall back to
// their deterministic/pool-based path rather than propagating the failure.
export async function callOpenAiJson(
  input: Array<{ role: string; content: unknown }>,
  format: JsonSchemaFormat,
  opts: { model?: string } = {}
): Promise<any | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const model = opts.model || process.env.OPENAI_MODEL || FALLBACK_MODEL
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
        text: {
          format: {
            type: 'json_schema',
            name: format.name,
            strict: true,
            schema: format.schema,
          },
        },
      }),
    })

    if (!response.ok) {
      console.error('OpenAI call failed', await response.text())
      return null
    }

    const data = await response.json()
    const text = extractOutputText(data)
    return text ? JSON.parse(text) : null
  } catch (error) {
    console.error('OpenAI call error', error)
    return null
  }
}
