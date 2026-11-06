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

  // Public verification page and lookup: intentionally read-only, no admin key.
  const verifyPage = path.match(/^\/verify\/([A-Za-z0-9-]+)\/?$/);
  if (verifyPage && req.method === "GET") {
    const code = verifyPage[1];
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JTP Document Verification</title><style>body{font:15px Arial;background:#f3f6fa;color:#172638;margin:0;padding:24px}.card{max-width:680px;margin:6vh auto;background:white;border:1px solid #e1e7ef;border-radius:16px;padding:28px;box-shadow:0 8px 30px #17345412}.status{font-size:20px;font-weight:800;color:#137a50}.row{padding:12px 0;border-bottom:1px solid #e8edf2}.label{color:#718096;font-size:12px;text-transform:uppercase}.value{font-weight:600;margin-top:4px}.muted{color:#68788a}</style></head><body><main class="card"><h2>Journal of Educational Technology</h2><p class="muted">Official document verification service</p><div id="result">Checking document...</div></main><script>fetch('/api/verify/${code}').then(r=>r.json()).then(d=>{const el=document.getElementById('result');if(!d.valid){el.innerHTML='<p style="color:#b42318;font-weight:bold">INVALID DOCUMENT / NOT FOUND</p><p>'+((d.message||'The verification code is not registered.').replace(/[<>&]/g,''))+'</p>';return}const x=d.document;const esc=s=>String(s??'-').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));el.innerHTML='<p class="status">✓ DOCUMENT VALID</p>'+[['Document Type',x.type],['Document Number',x.number],['Article Title',x.title],['Author(s)',x.authors],['Volume',x.volume],['Issue',x.issue],['Publication Month',x.publication_month],['Publication Year',x.publication_year],['Document Date',x.issue_date],['Status',x.status]].map(a=>'<div class="row"><div class="label">'+esc(a[0])+'</div><div class="value">'+esc(a[1])+'</div></div>').join('')+'<p class="muted">This information is verified directly against the Journal of Educational Technology database.</p>'}).catch(()=>document.getElementById('result').textContent='Verification failed. Please try again.');</script></body></html>`, {headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }
  const verifyApi = path.match(/^\/api\/verify\/([A-Za-z0-9-]+)$/);
  if (verifyApi && req.method === "GET") {
    try {
      const code = verifyApi[1];
      const inv = await env.DB.prepare("SELECT i.invoice_number AS number,i.issue_date,a.title,a.authors,a.volume,a.issue,a.publication_month,a.publication_year,i.payment_status AS status FROM invoices i JOIN articles a ON a.id=i.article_id WHERE i.verification_code=?").bind(code).first();
      if (inv) return json({valid:true,document:{type:"Invoice",...inv}});
      const loa = await env.DB.prepare("SELECT l.loa_number AS number,l.issue_date,a.title,a.authors,a.volume,a.issue,a.publication_month,a.publication_year,'Diterbitkan' AS status FROM loa_documents l JOIN articles a ON a.id=l.article_id WHERE l.verification_code=?").bind(code).first();
      if (loa) return json({valid:true,document:{type:"Letter of Acceptance",...loa}});
      return json({valid:false,message:"Kode verifikasi tidak terdaftar atau dokumen tidak ditemukan."},404);
    } catch (e) { return json({valid:false,message:"Layanan verifikasi belum siap. Hubungi administrator."},500); }
  }

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
    const article=await env.DB.prepare("SELECT id,title,authors,email FROM articles WHERE id=?").bind(b.article_id).first();
    if(!article) return json({error:"Artikel tidak ditemukan."},404);
    const id=uid(), number=await nextNumber(env.DB,"invoices","INV-JTP"), verificationCode=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO invoices(id,invoice_number,article_id,issue_date,due_date,amount,description,payment_status,payer_name,verification_code) VALUES(?,?,?,?,?,?,?,?,?,?)")
     .bind(id,number,b.article_id,clean(b.issue_date)||new Date().toISOString().slice(0,10),clean(b.due_date),Number(b.amount),clean(b.description),clean(b.payment_status)||"unpaid",clean(b.payer_name),verificationCode).run();
    await log(env.DB,"create","invoice",id,number);
    let notification = "not_configured";
    if (article.email && env.RESEND_API_KEY && env.EMAIL_FROM) {
      try {
        const pay = await env.DB.prepare("SELECT bank_name,bank_account_number,account_holder,qris_data_url,journal_name FROM journal_settings WHERE id=1").first();
        const emailHtml = `<h2>Invoice ${number}</h2><p>Dear ${clean(b.payer_name)||clean(article.authors)},</p><p>Please find the publication fee invoice for the article <b>${clean(article.title)}</b>.</p><h2>${Number(b.amount).toLocaleString("en-US")} IDR</h2><h3>Bank Transfer Information</h3><p>Bank: ${clean(pay?.bank_name)||"-"}<br>Account Number: ${clean(pay?.bank_account_number)||"-"}<br>Account Holder: ${clean(pay?.account_holder)||"Ary Purmadi"}</p>${pay?.qris_data_url?`<h3>QRIS Payment</h3><img alt="QRIS" width="220" src="${pay.qris_data_url}"><p>Please enter the invoice amount when making the payment.</p>`:""}<p>Invoice Number: ${number}</p><p>Please confirm your payment with the journal administrator.</p>`;
        const mailResp = await fetch("https://api.resend.com/emails", {method:"POST",headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:env.EMAIL_FROM,to:[article.email],subject:`Invoice ${number} - ${pay?.journal_name||"Jurnal Teknologi Pendidikan"}`,html:emailHtml})});
        notification = mailResp.ok ? "sent" : "failed";
      } catch (_) { notification = "failed"; }
    }
    return json({id,invoice_number:number,verification_code:verificationCode,notification},201);
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
    const article=await env.DB.prepare("SELECT id,title,authors,email FROM articles WHERE id=?").bind(b.article_id).first();
    if(!article) return json({error:"Artikel tidak ditemukan."},404);
    const issueDate=clean(b.issue_date)||new Date().toISOString().slice(0,10);
    const [year,month]=issueDate.split("-").map(Number);
    const romanMonths=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
    if(!year || !month || month<1 || month>12) return json({error:"Tanggal penerbitan LoA tidak valid."},400);
    // Continue existing 2026 manual numbering (e.g. 501); reset to 001 for each new year.
    const existing=await env.DB.prepare("SELECT loa_number,issue_date FROM loa_documents WHERE substr(issue_date,1,4)=?").bind(String(year)).all();
    let last=0;
    for(const row of (existing.results||[])){
      const match=String(row.loa_number||"").match(/^(\d+)(?:\/|$)/);
      if(match) last=Math.max(last,Number(match[1]));
    }
    const sequence=String(last+1).padStart(3,"0");
    const number=`${sequence}/LOA/JTP-UNDIKMA/${romanMonths[month-1]}/${year}`;
    const id=uid(), verificationCode=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO loa_documents(id,loa_number,article_id,issue_date,statement_text,signatory_name,signatory_title,verification_code) VALUES(?,?,?,?,?,?,?,?)")
     .bind(id,number,b.article_id,issueDate,clean(b.statement_text)||"This is to certify that the above-mentioned manuscript has been accepted for publication in the Journal of Educational Technology in the edition specified below.",clean(b.signatory_name),clean(b.signatory_title)||"Editor in Chief",verificationCode).run();
    await log(env.DB,"create","loa",id,number);
    return json({id,loa_number:number,verification_code:verificationCode},201);
   }
   if (path === "/api/settings" && req.method==="GET") {
    const row=await env.DB.prepare("SELECT * FROM journal_settings WHERE id=1").first();
    return json(row||{});
   }
   if (path === "/api/settings" && req.method==="PUT") {
    const b=await req.json();
    await env.DB.prepare(`UPDATE journal_settings SET journal_name=?,journal_full_name=?,publisher=?,address=?,email=?,website=?,eissn=?,pissn=?,accreditation=?,accreditation_decree=?,editor_name=?,editor_title=?,city=?,signature_data_url=?,logo_data_url=?,stamp_data_url=?,bank_name=?,bank_account_number=?,account_holder=?,qris_data_url=?,updated_at=datetime('now') WHERE id=1`)
     .bind(clean(b.journal_name),clean(b.journal_full_name),clean(b.publisher),clean(b.address),clean(b.email),clean(b.website),clean(b.eissn),clean(b.pissn),clean(b.accreditation),clean(b.accreditation_decree),clean(b.editor_name),clean(b.editor_title),clean(b.city),clean(b.signature_data_url),clean(b.logo_data_url),clean(b.stamp_data_url),clean(b.bank_name),clean(b.bank_account_number),clean(b.account_holder)||"Ary Purmadi",clean(b.qris_data_url)).run();
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
