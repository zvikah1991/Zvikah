// Vercel Edge Middleware — gates every request (including the static JS/CSS
// bundle) behind HTTP Basic Auth. This runs only when deployed on Vercel;
// it has no effect on local `npm run dev` or `npm run build`.
//
// Configure in the Vercel project: Settings → Environment Variables:
//   DASHBOARD_USER, DASHBOARD_PASSWORD
//
// If either variable is unset, all requests are denied (fail closed).

export const config = {
  matcher: "/(.*)",
};

export default function middleware(request: Request) {
  const expectedUser = process.env.DASHBOARD_USER;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ") && expectedUser && expectedPassword) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return;
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Sales Dashboard"' },
  });
}
