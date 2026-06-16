import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const BACKEND = process.env.BACKEND_URL || 'https://65.21.125.14:2083';

// Node.js HTTPS agent that accepts self-signed certs.
// Runs server-side only — the browser never touches the backend SSL cert.
const agent = new https.Agent({ rejectUnauthorized: false });

async function proxy(request: NextRequest, params: { path: string[] }): Promise<NextResponse> {
  const path = params.path.join('/');
  const search = new URL(request.url).searchParams.toString();
  const targetUrl = `${BACKEND}/${path}${search ? `?${search}` : ''}`;

  const forwardHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!['host', 'connection', 'transfer-encoding', 'te', 'trailer', 'upgrade'].includes(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  });

  const body = !['GET', 'HEAD'].includes(request.method) ? await request.text() : undefined;

  return new Promise<NextResponse>((resolve) => {
    const url = new URL(targetUrl);
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + (url.search || ''),
        method: request.method,
        headers: forwardHeaders,
        agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const data = Buffer.concat(chunks);
          const headers = new Headers();
          Object.entries(res.headers).forEach(([k, v]) => {
            if (v && !['transfer-encoding', 'connection'].includes(k)) {
              headers.set(k, Array.isArray(v) ? v.join(', ') : v);
            }
          });
          resolve(new NextResponse(data, { status: res.statusCode || 200, headers }));
        });
        res.on('error', (err) => {
          resolve(NextResponse.json({ error: { code: 'UPSTREAM_ERROR', message: err.message } }, { status: 502 }));
        });
      },
    );

    req.on('error', (err) => {
      resolve(NextResponse.json({ error: { code: 'PROXY_ERROR', message: err.message } }, { status: 502 }));
    });

    if (body) req.write(body);
    req.end();
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params);
}
