const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};
const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...cors }
});
const uid = () => crypto.randomUUID();
const clean = v => String(v ?? "").trim();

async function authorised(req, env) {
  const expected = env.ADMIN_API_KEY;
  const got = req.headers.get("X-Admin-Key") || "";
  if (!expected || !got || got.length !== expected.length) return false;
  const a = new TextEncoder().encode(got), b = new TextEncoder().encode(expected);
  let diff = 0;
  for (let i=0;i<a.length;i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
function slugYear() { return new Date().getFullYear(); }
async function nextNumber(db, table, prefix) {
  const year = slugYear();
  const col = table === "invoices" ? "invoice_number" : "loa_number";
  const row = await db.prepare(`SELECT ${col} AS n FROM ${table} WHERE ${col} LIKE ? ORDER BY ${col} DESC LIMIT 1`)
    .bind(`${prefix}/${year}/%`).first();
  const last = row?.n ? Number(row.n.split("/").pop()) : 0;
  return `${prefix}/${year}/${String(last+1).padStart(4,"0")}`;
}
async function log(db, action, type, id, detail="") {
  await db.prepare("INSERT INTO audit_logs(id,action,entity_type,entity_id,detail) VALUES(?,?,?,?,?)")
    .bind(uid(),action,type,id,detail).run();
}
export default {
 async fetch(req, env) {
  if (req.method === "OPTIONS") return new Response(null,{headers:cors});
  const url = new URL(req.url), path = url.pathname;
  if (!path.startsWith("/api/")) return json({error:"Not found"},404);
  if (!(await authorised(req,env))) return json({error:"Unauthorized"},401);
  try {
   if (path === "/api/summary" && req.method==="GET") {
    const [a,i,l,p] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) n FROM articles").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM invoices").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM loa_documents").first(),
      env.DB.prepare("SELECT COALESCE(SUM(amount),0) n FROM invoices WHERE payment_status='paid'").first()
    ]);
    return json({articles:a.n,invoices:i.n,loas:l.n,revenue:p.n});
   }
   if (path === "/api/articles" && req.method==="GET") {
    const {results=[]} = await env.DB.prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
    return json(results);
   }
   if (path === "/api/articles" && req.method==="POST") {
    const b=await req.json();
    if (!clean(b.title) || !clean(b.authors)) return json({error:"Judul artikel dan nama penulis wajib diisi."},400);
    const id=uid(), code=`JTP-${slugYear()}-${id.slice(0,8).toUpperCase()}`;
    await env.DB.prepare(`INSERT INTO articles
      (id,article_code,title,authors,corresponding_author,email,affiliation,volume,issue,publication_year,publication_month,received_date,accepted_date,status)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,code,clean(b.title),clean(b.authors),clean(b.corresponding_author),clean(b.email),clean(b.affiliation),
       clean(b.volume),clean(b.issue),clean(b.publication_year),clean(b.publication_month),clean(b.received_date),clean(b.accepted_date),clean(b.status)||"submitted").run();
    await log(env.DB,"create","article",id,code);
    return json({id,article_code:code},201);
   }
   const artMatch=path.match(/^\/api\/articles\/([^/]+)$/);
   if (artMatch && req.method==="PUT") {
    const b=await req.json(), id=artMatch[1];
    await env.DB.prepare(`UPDATE articles SET title=?,authors=?,corresponding_author=?,email=?,affiliation=?,volume=?,issue=?,publication_year=?,publication_month=?,received_date=?,accepted_date=?,status=?,updated_at=datetime('now') WHERE id=?`)
     .bind(clean(b.title),clean(b.authors),clean(b.corresponding_author),clean(b.email),clean(b.affiliation),clean(b.volume),clean(b.issue),clean(b.publication_year),clean(b.publication_month),clean(b.received_date),clean(b.accepted_date),clean(b.status),id).run();
    await log(env.DB,"update","article",id);
    return json({ok:true});
   }
   if (path === "/api/invoices" && req.method==="GET") {
    const {results=[]}=await env.DB.prepare("SELECT i.*,a.title,a.authors,a.email,a.volume,a.issue,a.publication_year,a.publication_month FROM invoices i JOIN articles a ON a.id=i.article_id ORDER BY i.created_at DESC").all();
    return json(results);
   }
   if (path === "/api/invoices" && req.method==="POST") {
    const b=await req.json();
    if (!b.article_id || !Number.isFinite(Number(b.amount)) || Number(b.amount)<0) return json({error:"Artikel dan nominal invoice wajib valid."},400);
    const article=await env.DB.prepare("SELECT id FROM articles WHERE id=?").bind(b.article_id).first();
    if(!article) return json({error:"Artikel tidak ditemukan."},404);
    const id=uid(), number=await nextNumber(env.DB,"invoices","INV-JTP");
    await env.DB.prepare("INSERT INTO invoices(id,invoice_number,article_id,issue_date,due_date,amount,description,payment_status,payer_name) VALUES(?,?,?,?,?,?,?,?,?)")
     .bind(id,number,b.article_id,clean(b.issue_date)||new Date().toISOString().slice(0,10),clean(b.due_date),Number(b.amount),clean(b.description),clean(b.payment_status)||"unpaid",clean(b.payer_name)).run();
    await log(env.DB,"create","invoice",id,number);
    return json({id,invoice_number:number},201);
   }
   const payMatch=path.match(/^\/api\/invoices\/([^/]+)\/payment$/);
   if(payMatch && req.method==="POST"){
    const b=await req.json();
    await env.DB.prepare("UPDATE invoices SET payment_status=?,paid_date=? WHERE id=?")
     .bind(b.payment_status==="paid"?"paid":"unpaid",b.payment_status==="paid"?(clean(b.paid_date)||new Date().toISOString().slice(0,10)):null,payMatch[1]).run();
    await log(env.DB,"payment_update","invoice",payMatch[1],b.payment_status);
    return json({ok:true});
   }
   if (path === "/api/loa" && req.method==="GET") {
    const {results=[]}=await env.DB.prepare("SELECT l.*,a.title,a.authors,a.email,a.volume,a.issue,a.publication_year,a.publication_month FROM loa_documents l JOIN articles a ON a.id=l.article_id ORDER BY l.created_at DESC").all();
    return json(results);
   }
   if (path === "/api/loa" && req.method==="POST") {
    const b=await req.json();
    const article=await env.DB.prepare("SELECT id FROM articles WHERE id=?").bind(b.article_id).first();
    if(!article) return json({error:"Artikel tidak ditemukan."},404);
    const id=uid(), number=await nextNumber(env.DB,"loa_documents","LOA-JTP");
    await env.DB.prepare("INSERT INTO loa_documents(id,loa_number,article_id,issue_date,statement_text,signatory_name,signatory_title) VALUES(?,?,?,?,?,?,?)")
     .bind(id,number,b.article_id,clean(b.issue_date)||new Date().toISOString().slice(0,10),clean(b.statement_text),clean(b.signatory_name),clean(b.signatory_title)||"Editor in Chief").run();
    await log(env.DB,"create","loa",id,number);
    return json({id,loa_number:number},201);
   }
   if (path === "/api/settings" && req.method==="GET") {
    const row=await env.DB.prepare("SELECT * FROM journal_settings WHERE id=1").first();
    return json(row||{});
   }
   if (path === "/api/settings" && req.method==="PUT") {
    const b=await req.json();
    await env.DB.prepare(`UPDATE journal_settings SET journal_name=?,journal_full_name=?,publisher=?,address=?,email=?,website=?,eissn=?,pissn=?,accreditation=?,accreditation_decree=?,editor_name=?,editor_title=?,city=?,signature_data_url=?,logo_data_url=?,stamp_data_url=?,updated_at=datetime('now') WHERE id=1`)
     .bind(clean(b.journal_name),clean(b.journal_full_name),clean(b.publisher),clean(b.address),clean(b.email),clean(b.website),clean(b.eissn),clean(b.pissn),clean(b.accreditation),clean(b.accreditation_decree),clean(b.editor_name),clean(b.editor_title),clean(b.city),clean(b.signature_data_url),clean(b.logo_data_url),clean(b.stamp_data_url)).run();
    await log(env.DB,"update","settings","1","journal settings updated");
    return json({ok:true});
   }
   if (path === "/api/audit" && req.method==="GET") {
    const {results=[]}=await env.DB.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200").all();
    return json(results);
   }
   return json({error:"Endpoint not found"},404);
  } catch(e) {
   return json({error:e?.message || "Internal server error"},500);
  }
 }
};
