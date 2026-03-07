import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://daemon:8080/api/v1/health', { cache: 'no-store' });
    if (!res.ok) throw new Error('Daemon unreachable');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ cpu_usage_percent: 0, memory_usage_percent: 0 }, { status: 503 });
  }
}