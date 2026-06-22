(() => {
  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const params = new URLSearchParams(location.search);
  const LEAGUE = String(params.get("league") || "YAMO");
  const USER_ID = String(params.get("id") || params.get("user_id") || "").trim();

  let currentData = null;
  let historyRows = [];
  let player = null;
  let showPoints = true;
  let showRank = true;

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
  function full(v){const x=n(v);return x==null?"—":x.toLocaleString("en-US")}
  function short(v){const x=n(v);if(x==null)return"—";const a=Math.abs(x);if(a>=1e12)return(x/1e12).toFixed(2).replace(/\.00$/,"")+"T";if(a>=1e9)return(x/1e9).toFixed(2).replace(/\.00$/,"")+"B";if(a>=1e6)return(x/1e6).toFixed(2).replace(/\.00$/,"")+"M";if(a>=1e3)return(x/1e3).toFixed(2).replace(/\.00$/,"")+"K";return x.toLocaleString("en-US")}
  function dt(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?"—":d.toLocaleString()}
  function dateOnly(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?"—":d.toLocaleDateString()}
  function duration(ms){if(!Number.isFinite(ms)||ms<=0)return"—";let m=Math.round(ms/60000);const d=Math.floor(m/1440);m%=1440;const h=Math.floor(m/60);m%=60;const p=[];if(d)p.push(d+"d");if(h)p.push(h+"h");if(m||!p.length)p.push(m+"m");return p.join(" ")}
  function initials(s){s=String(s||"?").trim();return s.slice(0,2).toUpperCase()}
  function iconUrl(icon){const t=String(icon||"").trim();if(!t)return"";if(/^https?:\/\//i.test(t)||t.startsWith("data:"))return t;const m=t.match(/rbxassetid:\/\/(\d+)/i);if(m)return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(m[1]);if(/^\d+$/.test(t))return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(t);return""}

  async function getJson(url){
    url.searchParams.set("v",Date.now());
    const r=await fetch(url,{cache:"no-store"});
    const data=await r.json();
    if(!r.ok||data.ok===false)throw new Error(data.message||"HTTP "+r.status);
    return data;
  }

  function dedupe(rows){
    const byTime=new Map();
    rows.forEach(r=>{
      const t=new Date(r.fetched_at||0).getTime();
      if(!Number.isFinite(t))return;
      byTime.set(t,{...r,_t:t,points:n(r.points),rank:n(r.rank)});
    });
    return [...byTime.values()].sort((a,b)=>a._t-b._t);
  }

  function computeStats(rows){
    if(!rows.length)return null;
    const first=rows[0], last=rows[rows.length-1];
    let activeMs=0, flatMs=0, gained=0, bestRank=Infinity, worstRank=-Infinity;
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      if(r.rank!=null){bestRank=Math.min(bestRank,r.rank);worstRank=Math.max(worstRank,r.rank)}
      if(i===0)continue;
      const prev=rows[i-1];
      const gap=Math.max(0,r._t-prev._t);
      const delta=(r.points??0)-(prev.points??0);
      if(delta>0){activeMs+=gap;gained+=delta}else flatMs+=gap;
    }
    return {
      first,last,gained,
      bestRank:Number.isFinite(bestRank)?bestRank:null,
      worstRank:Number.isFinite(worstRank)?worstRank:null,
      trackedMs:last._t-first._t,
      activeMs,flatMs
    };
  }

  function renderHeader(){
    const name=player?.username||player?.display_name||historyRows[historyRows.length-1]?.display_name||USER_ID;
    const avatar=player?.avatar_url;
    document.title=name+" · "+LEAGUE+" League Profile";
    document.getElementById("profile-name").textContent=name;
    document.getElementById("profile-subtitle").textContent="User ID: "+USER_ID+" · League: "+LEAGUE;
    document.getElementById("roblox-link").href="https://www.roblox.com/users/"+encodeURIComponent(USER_ID)+"/profile";
    const a=document.getElementById("profile-avatar");
    if(avatar){a.innerHTML='<img src="'+esc(avatar)+'" alt="">'}else a.textContent=initials(name);
  }

  function renderCards(stats){
    document.getElementById("card-snapshots").textContent=historyRows.length.toLocaleString("en-US");
    document.getElementById("card-league").textContent=currentData?.league_name||LEAGUE;
    document.getElementById("card-points").textContent=full(stats?.last?.points);
    document.getElementById("card-seen").textContent=stats?.last?.fetched_at?dt(stats.last.fetched_at):"—";
  }

  function renderSummary(stats){
    const title=document.getElementById("history-title");
    title.textContent=(currentData?.league_name||LEAGUE)+" League Performance";
    document.getElementById("date-range").textContent=(stats?dateOnly(stats.first.fetched_at)+" — "+dateOnly(stats.last.fetched_at):"—");
  }

  function drawChart(){
    const canvas=document.getElementById("progress-chart");
    const ctx=canvas.getContext("2d");
    const rect=canvas.getBoundingClientRect();
    const dpr=devicePixelRatio||1;
    canvas.width=Math.floor(rect.width*dpr);
    canvas.height=Math.floor(rect.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,rect.width,rect.height);

    const rows=historyRows;
    if(rows.length<2){ctx.fillStyle="#8b949e";ctx.fillText("Not enough history to chart yet.",16,26);return}

    const padL=68,padR=34,padT=18,padB=34,w=rect.width-padL-padR,h=rect.height-padT-padB;
    const minT=rows[0]._t,maxT=rows[rows.length-1]._t;
    const points=rows.map(r=>r.points).filter(v=>v!=null);
    const ranks=rows.map(r=>r.rank).filter(v=>v!=null);
    const minP=Math.min(...points),maxP=Math.max(...points),pPad=Math.max((maxP-minP)*.08,1);
    const minR=Math.min(...ranks),maxR=Math.max(...ranks);
    const x=r=>padL+((r._t-minT)/Math.max(1,maxT-minT))*w;
    const yP=r=>padT+(1-(((r.points??minP)-(minP-pPad))/Math.max(1,(maxP+pPad)-(minP-pPad))))*h;
    const yR=r=>padT+(((r.rank??maxR)-minR)/Math.max(1,maxR-minR))*h;

    ctx.strokeStyle="#30363d";ctx.lineWidth=1;ctx.font="12px Arial";ctx.fillStyle="#8b949e";
    for(let i=0;i<=4;i++){const yy=padT+i*h/4;ctx.beginPath();ctx.moveTo(padL,yy);ctx.lineTo(rect.width-padR,yy);ctx.stroke();const val=maxP-(i/4)*(maxP-minP);ctx.fillText(short(val),8,yy+4)}

    function line(y,color){
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();let started=false;
      rows.forEach(r=>{if(r.points==null&&y===yP)return;if(r.rank==null&&y===yR)return;if(!started){ctx.moveTo(x(r),y(r));started=true}else ctx.lineTo(x(r),y(r))});
      ctx.stroke();
      const last=rows[rows.length-1];ctx.fillStyle=color;ctx.beginPath();ctx.arc(x(last),y(last),3,0,Math.PI*2);ctx.fill();
    }
    if(showPoints)line(yP,"#ff8b86");
    if(showRank)line(yR,"#f2cc60");

    ctx.fillStyle="#8b949e";
    ctx.fillText(dateOnly(rows[0].fetched_at),padL,rect.height-12);
    const endLabel=dateOnly(rows[rows.length-1].fetched_at);
    ctx.fillText(endLabel,rect.width-padR-ctx.measureText(endLabel).width,rect.height-12);
  }

  async function load(){
    if(!USER_ID){document.getElementById("error").textContent="Missing player id in URL.";return}
    try{
      const curUrl=new URL(API+"/api/leagues/current");curUrl.searchParams.set("league",LEAGUE);
      const histUrl=new URL(API+"/api/leagues/history");histUrl.searchParams.set("league",LEAGUE);histUrl.searchParams.set("user_id",USER_ID);histUrl.searchParams.set("hours","all");histUrl.searchParams.set("limit","50000");
      const [cur,hist]=await Promise.all([getJson(curUrl),getJson(histUrl)]);
      currentData=cur;
      player=(cur.rows||[]).find(r=>String(r.user_id)===String(USER_ID))||null;
      historyRows=dedupe(hist.rows||[]);
      const stats=computeStats(historyRows);
      renderHeader();renderCards(stats);renderSummary(stats);drawChart();
    }catch(e){console.error(e);document.getElementById("error").textContent=e.message||String(e)}
  }

  document.getElementById("points-toggle").addEventListener("change",e=>{showPoints=e.target.checked;drawChart()});
  document.getElementById("rank-toggle").addEventListener("change",e=>{showRank=e.target.checked;drawChart()});
  addEventListener("resize",()=>setTimeout(drawChart,100));
  load();
})();