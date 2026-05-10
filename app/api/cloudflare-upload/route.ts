export async function POST() {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_STREAM_TOKEN;
    if (!accountId || !token) return Response.json({ success:false, error:"Missing Cloudflare environment variables" }, { status:500 });
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`, {
      method:"POST",
      headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify({ maxDurationSeconds: 600 })
    });
    const data = await response.json();
    if (!response.ok || !data.success) return Response.json({ success:false, error:data.errors?.[0]?.message || "Cloudflare upload URL failed" }, { status:500 });
    return Response.json({ success:true, uploadURL:data.result.uploadURL, uid:data.result.uid });
  } catch {
    return Response.json({ success:false, error:"Failed to create upload URL" }, { status:500 });
  }
}
