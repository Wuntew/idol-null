export const DEEPSEEK_MODEL = 'deepseek-chat'

// Calls DeepSeek Chat Completions API with json_object output mode.
// Returns parsed JSON on success, null on missing key, request failure, or any error.
// Schema is enforced via prompt rather than API-level strict mode.
export async function callDeepSeekJson(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  opts: { model?: string } = {}
): Promise<any | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return null

  try {
    const model = opts.model ?? DEEPSEEK_MODEL
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 1.0,
      }),
    })

    if (!response.ok) {
      console.error('[deepseek] call failed:', await response.text())
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return null
    return JSON.parse(content)
  } catch (error) {
    console.error('[deepseek] call error:', error)
    return null
  }
}
