const http = require("node:http");

const PORT = process.env.PORT || 3000;

const services = [
  { name: "EC2 Application", status: "Healthy", uptime: "99.98%", latency: "42 ms" },
  { name: "REST API", status: "Healthy", uptime: "99.95%", latency: "86 ms" },
  { name: "Database", status: "Degraded", uptime: "98.70%", latency: "420 ms" },
  { name: "Payment Service", status: "Healthy", uptime: "99.99%", latency: "65 ms" }
];

const incidents = [
  { id: "INC-1001", title: "Elevated database response time", service: "Database", severity: "High", status: "Investigating", time: "10:42 AM" },
  { id: "INC-1002", title: "API latency returned to normal", service: "REST API", severity: "Low", status: "Resolved", time: "09:18 AM" },
  { id: "INC-1003", title: "Scheduled maintenance completed", service: "EC2 Application", severity: "Low", status: "Resolved", time: "08:30 AM" }
];

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpsPulse | Service Operations</title>
<style>
:root{color-scheme:dark;--bg:#0b1120;--panel:#121c2e;--border:#26344b;--muted:#91a0b8;--text:#edf3ff;--blue:#66a3ff;--green:#40d6a0;--amber:#f6bf58;--red:#ff747e}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 Inter,Segoe UI,Arial,sans-serif}
.layout{display:grid;grid-template-columns:220px minmax(0,1fr);min-height:100vh}
aside{background:#0e1728;border-right:1px solid var(--border);padding:26px 18px}
.brand{font-size:22px;font-weight:800;letter-spacing:-1px;margin-bottom:38px}
.brand span{color:var(--blue)}
.navtitle{color:#65758e;font-size:11px;letter-spacing:1.5px;margin:24px 10px 10px}
.nav{padding:11px 12px;border-radius:8px;color:#a8b7cc;margin:4px 0}
.nav.active{background:#1c3150;color:white}
main{min-width:0;padding:30px clamp(18px,4vw,48px);max-width:1600px;width:100%;margin:auto}
.topbar{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:32px}
h1{font-size:27px;letter-spacing:-.7px;margin:0 0 5px}
.muted{color:var(--muted)}
.live{color:var(--green);border:1px solid #245b4d;padding:7px 10px;border-radius:20px;white-space:nowrap;font-size:12px}
.live:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);margin-right:7px}
.sectionhead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:28px 0 14px}
h2{font-size:16px;margin:0}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.card,.panel{background:var(--panel);border:1px solid var(--border);border-radius:13px}
.card{padding:20px}
.metric-label{color:var(--muted);font-size:12px}
.metric{font-size:29px;font-weight:750;letter-spacing:-1px;margin:10px 0 5px}
.note{font-size:12px;color:var(--muted)}
.green{color:var(--green)}.amber{color:var(--amber)}.red{color:var(--red)}.blue{color:var(--blue)}
.columns{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(250px,1fr);gap:16px}
.panel{padding:20px;min-width:0}
.service{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid var(--border)}
.service:last-child{border-bottom:0}
.service-name{font-weight:650}.sub{font-size:12px;color:var(--muted);margin-top:3px}
.pill{display:inline-block;padding:5px 9px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap}
.Healthy,.Resolved{color:var(--green);background:#16372f}
.Degraded,.High,.Investigating{color:var(--amber);background:#3b3020}
.Low{color:var(--blue);background:#1b3151}
.Down,.Critical{color:var(--red);background:#40232d}
.bar{height:5px;background:#28364b;border-radius:10px;overflow:hidden;margin-top:10px}
.bar span{display:block;height:100%;background:var(--blue);border-radius:10px}
.incident{padding:16px 0;border-bottom:1px solid var(--border)}
.incident:last-child{border-bottom:0}
.incident-title{font-weight:600;margin-bottom:7px}
.incident-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tablewrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}
th,td{padding:14px 12px;border-bottom:1px solid var(--border)}
th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.7px}
tbody tr:last-child td{border-bottom:0}
select,button{background:#192740;color:var(--text);border:1px solid var(--border);border-radius:7px;padding:9px 12px}
button{cursor:pointer}
button:hover{border-color:var(--blue)}
footer{padding:24px 0;color:#71819a;font-size:12px}
@media(max-width:1050px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.columns{grid-template-columns:1fr}}
@media(max-width:650px){.layout{grid-template-columns:1fr}aside{display:none}main{padding:22px 14px}.topbar{align-items:flex-start;flex-direction:column}.metrics{gap:9px}.card{padding:14px}.metric{font-size:24px}.service{grid-template-columns:minmax(0,1fr) auto;gap:8px}.service .latency{display:none}}
</style>
</head>
<body>
<div class="layout">
<aside>
<div class="brand">Ops<span>Pulse</span></div>
<div class="navtitle">WORKSPACE</div>
<div class="nav active">▦ &nbsp; Overview</div>
<div class="nav">◉ &nbsp; Service health</div>
<div class="nav">▤ &nbsp; Incidents</div>
<div class="navtitle">OPERATIONS</div>
<div class="nav">⌁ &nbsp; Monitoring</div>
<div class="nav">⚙ &nbsp; Settings</div>
</aside>
<main>
<header class="topbar">
<div><div class="muted">OPERATIONS / OVERVIEW</div><h1>Service Operations</h1><div class="muted">Monitor service health and incident activity.</div></div>
<div class="live" id="health">Checking application</div>
</header>
<section class="metrics">
<div class="card"><div class="metric-label">TOTAL SERVICES</div><div class="metric" id="total">—</div><div class="note">Registered services</div></div>
<div class="card"><div class="metric-label">HEALTHY SERVICES</div><div class="metric green" id="healthy">—</div><div class="note">Currently operational</div></div>
<div class="card"><div class="metric-label">ACTIVE INCIDENTS</div><div class="metric amber" id="active">—</div><div class="note">Require investigation</div></div>
<div class="card"><div class="metric-label">SERVICE AVAILABILITY</div><div class="metric blue" id="availability">—</div><div class="note">Average reported uptime</div></div>
</section>
<div class="sectionhead"><h2>Infrastructure health</h2><button id="refresh">↻ Refresh</button></div>
<section class="columns">
<div class="panel"><h2>Service status</h2><p class="muted">Availability and response time</p><div id="services"></div></div>
<div class="panel"><h2>Incident activity</h2><p class="muted">Latest operational events</p><div id="incidents"></div></div>
</section>
<div class="sectionhead"><h2>Incident register</h2><select id="filter"><option value="All">All incidents</option><option>Investigating</option><option>Resolved</option></select></div>
<section class="panel tablewrap">
<table><thead><tr><th>Incident ID</th><th>Description</th><th>Service</th><th>Severity</th><th>Status</th></tr></thead><tbody id="register"></tbody></table>
</section>
<footer>OpsPulse · Training and portfolio environment · Service data is simulated</footer>
</main>
</div>
<script>
const services = ${JSON.stringify(services)};
const incidents = ${JSON.stringify(incidents)};
const $ = id => document.getElementById(id);
function pill(value){return '<span class="pill '+value+'">'+value+'</span>'}
function render(){
$('total').textContent=services.length;
$('healthy').textContent=services.filter(s=>s.status==='Healthy').length;
$('active').textContent=incidents.filter(i=>i.status!=='Resolved').length;
$('availability').textContent=(services.reduce((n,s)=>n+parseFloat(s.uptime),0)/services.length).toFixed(2)+'%';
$('services').innerHTML=services.map(s=>'<div class="service"><div><div class="service-name">'+s.name+'</div><div class="sub">Uptime '+s.uptime+'</div><div class="bar"><span style="width:'+parseFloat(s.uptime)+'%"></span></div></div><div>'+pill(s.status)+'</div><div class="latency muted">'+s.latency+'</div></div>').join('');
$('incidents').innerHTML=incidents.slice(0,3).map(i=>'<div class="incident"><div class="incident-title">'+i.title+'</div><div class="incident-meta"><span class="muted">'+i.id+'</span>'+pill(i.severity)+' '+pill(i.status)+'</div></div>').join('');
const filtered=incidents.filter(i=>$('filter').value==='All'||i.status===$('filter').value);
$('register').innerHTML=filtered.map(i=>'<tr><td>'+i.id+'</td><td>'+i.title+'</td><td>'+i.service+'</td><td>'+pill(i.severity)+'</td><td>'+pill(i.status)+'</td></tr>').join('');
$('health').textContent='Demo data · Application UI ready';
}
$('refresh').addEventListener('click',render);
$('filter').addEventListener('change',render);
render();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "UP", application: "OpsPulse" }));
  }

  if (req.url === "/api/services") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ count: services.length, services }));
  }

  if (req.url === "/api/incidents") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ count: incidents.length, incidents }));
  }

  if (req.url === "/" || req.url.startsWith("/?")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(page);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`OpsPulse running at http://localhost:${PORT}`);
  });
}

module.exports = server;

