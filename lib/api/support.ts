const RAW_SITE_URL = String(process.env.EXPO_PUBLIC_SITE_URL || "").trim()

function getApiOrigin() {
  if (RAW_SITE_URL && !/supabase\.co/i.test(RAW_SITE_URL)) {
    try {
      return new URL(RAW_SITE_URL).origin
    } catch {
      try {
        const withScheme = /^https?:\/\//i.test(RAW_SITE_URL)
          ? RAW_SITE_URL
          : `https://${RAW_SITE_URL}`
        return new URL(withScheme).origin
      } catch {
        return RAW_SITE_URL.replace(/\/+$/, "")
      }
    }
  }

  return "https://iron-metal.net"
}

const API_ORIGIN = getApiOrigin()

async function postJson(url: string, args: { token: string; body: string }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.token}`,
    },
    body: args.body,
  })

  const text = await res.text().catch(() => "")
  let json: any = null

  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = null
  }

  return { res, json, text }
}

export type SendSupportRequestArgs = {
  token: string
  message: string
  img?: string | null
}

export type SendSupportRequestResult =
  | { success: true; id: string | number | null }
  | { success: false; error: string; status?: number }

export async function sendSupportRequest(
  args: SendSupportRequestArgs,
): Promise<SendSupportRequestResult> {
  const url = `${API_ORIGIN}/api/mobile/support`

  const body = JSON.stringify({
    message: args.message,
    img: args.img ?? null,
  })

  const result = await postJson(url, { token: args.token, body })

  const ok = result.res.ok && result.json?.success === true
  if (ok) {
    return { success: true, id: result.json?.id ?? null }
  }

  const message =
    result.json?.error ||
    result.json?.message ||
    (result.text ? String(result.text).slice(0, 200) : null) ||
    "Failed"

  return { success: false, error: String(message), status: result.res.status }
}
