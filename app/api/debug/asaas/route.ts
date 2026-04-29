import { NextResponse } from 'next/server'

export async function GET() {
  const key = '$' + (process.env.ASAAS_API_KEY ?? '')
  return NextResponse.json({
    length: key.length,
    prefix: key.slice(0, 12),
    firstChar: key.charCodeAt(0),
  })
}
