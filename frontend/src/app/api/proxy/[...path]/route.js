const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://finsmart-web1.onrender.com';

function buildTargetUrl(request, pathParts) {
  const url = new URL(request.url);
  const backendBase = BACKEND_URL.replace(/\/+$/, '');
  const path = pathParts.join('/');
  return `${backendBase}/${path}${url.search}`;
}

async function proxy(request, { params }) {
  const pathParts = params?.path || [];
  const targetUrl = buildTargetUrl(request, pathParts);

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('content-length');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.text();
  }

  const res = await fetch(targetUrl, init);
  const responseHeaders = new Headers(res.headers);

  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('connection');

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request, context) {
  return proxy(request, context);
}

export async function POST(request, context) {
  return proxy(request, context);
}

export async function PUT(request, context) {
  return proxy(request, context);
}

export async function PATCH(request, context) {
  return proxy(request, context);
}

export async function DELETE(request, context) {
  return proxy(request, context);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
