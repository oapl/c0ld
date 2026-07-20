(() => {
  const API = "https://yamo-league-api-worker.opal-dde.workers.dev";
  const TOP_LEAGUES_NAME = "GLOBAL_TOP_1000_LEAGUES";
  const config = window.LEAGUE_CONFIG || {};
  const LEAGUE = String(config.league || "YAMO");
  const API_LEAGUE = String(config.apiLeague || config.league || "YAMO");
  const RUN_KEY = String(config.run || config.runKey || "tap-heroes-part-2").trim();
  const SHOW_RACE_SUMMARY = config.showRaceSummary === true || String(config.showRaceSummary || "").toLowerCase() === "true";
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  let rows = [];
  let currentData = null;
  let topLeagueRow = null;
  let milestoneRows = [];
  let memberHistoryRows = [];
  let topLeagueHistoryName = TOP_LEAGUES_NAME;
  let leagueRankHistoryRows = [];
  let sortKey = "rank";
  let sortAsc = true;
  let loading = false;
  const GROWTH_BUCKET_MS = 15 * 60 * 1000;
  const GROWTH_WINDOW_MS = 24 * 60 * 60 * 1000;
  const GROWTH_COLORS = ["#ff8b86", "#58a6ff", "#7ee787", "#f2cc60", "#bc8cff", "#79c0ff"];
  const REWARD_TIERS = [
    { start:1,end:1,reward:"Rainbow Shiny Titanic Warrior Jaguar",image:"https://ps99.biggamesapi.io/image/123380410310415",variant:"rainbow shiny" },
    { start:2,end:3,reward:"Golden Shiny Titanic Warrior Jaguar",image:"https://ps99.biggamesapi.io/image/132193905783959",variant:"golden shiny" },
    { start:4,end:15,reward:"Rainbow Titanic Warrior Jaguar",image:"https://ps99.biggamesapi.io/image/123380410310415",variant:"rainbow" },
    { start:16,end:50,reward:"Shiny Titanic Warrior Jaguar",image:"https://ps99.biggamesapi.io/image/123380410310415",variant:"shiny" },
    { start:51,end:100,reward:"Golden Titanic Warrior Jaguar",image:"https://ps99.biggamesapi.io/image/132193905783959",variant:"golden" },
    { start:101,end:250,reward:"Titanic Warrior Jaguar",image:"https://ps99.biggamesapi.io/image/123380410310415",variant:"standard" },
    { start:251,end:2000,reward:"Huge Naga Cobra",image:"https://ps99.biggamesapi.io/image/101644631988314",variant:"standard" }
  ];

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
  function shortNum(v){const n=Number(v);if(!Number.isFinite(n))return"—";const a=Math.abs(n);if(a>=1e12)return(n/1e12).toFixed(2).replace(/\.00$/,"")+"T";if(a>=1e9)return(n/1e9).toFixed(2).replace(/\.00$/,"")+"B";if(a>=1e6)return(n/1e6).toFixed(2).replace(/\.00$/,"")+"M";if(a>=1e3)return(n/1e3).toFixed(2).replace(/\.00$/,"")+"K";return n.toLocaleString("en-US")}
  function fullNum(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString("en-US"):"—"}
  function dt(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?"—":d.toLocaleString()}
  function delta(v){if(v==null)return'<span class="unknown">—</span>';const n=Number(v);if(!Number.isFinite(n))return'<span class="unknown">—</span>';if(n>0)return'<span class="positive">+'+shortNum(n)+'</span>';if(n<0)return'<span class="negative">'+shortNum(n)+'</span>';return'<span class="zero">0</span>'}
  function initials(s){s=String(s||"?").trim();return s.slice(0,2).toUpperCase()}
  function iconUrl(icon){const t=String(icon||"").trim();if(!t)return"";if(/^https?:\/\//i.test(t)||t.startsWith("data:"))return t;const m=t.match(/rbxassetid:\/\/(\d+)/i);if(m)return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(m[1]);if(/^\d+$/.test(t))return"https://ps99.biggamesapi.io/image/"+encodeURIComponent(t);return""}
  function isFallbackMemberName(value,userId){const text=String(value||"").trim(),id=String(userId||"").trim();return !text||(id&&text===id)||/^user[ _-]?\d+$/i.test(text)}
  function memberName(row){const id=String(row?.user_id||"").trim();const names=[row?.username,row?.display_name];return names.map(value=>String(value||"").trim()).find(value=>!isFallbackMemberName(value,id))||(id?"User "+id:"Unknown player")}
  function avatar(r){const url=String(r.avatar_url||"").trim();return url?'<img class="avatar" src="'+esc(url)+'" alt="">':'<span class="avatar">'+esc(initials(memberName(r)))+'</span>'}
  function compare(a,b,k,asc){const an=Number(a[k]),bn=Number(b[k]);let r=Number.isFinite(an)&&Number.isFinite(bn)?an-bn:String(a[k]||"").localeCompare(String(b[k]||""));return asc?r:-r}
  function addRunParam(url){if(RUN_KEY)url.searchParams.set("run",RUN_KEY);return url}
  function profileHref(r){
    let href="league-profile.html?league="+encodeURIComponent(currentData?.league_name||API_LEAGUE||LEAGUE)+"&id="+encodeURIComponent(r.user_id||"");
    if(RUN_KEY)href+="&run="+encodeURIComponent(RUN_KEY);
    return href;
  }
  function visible(){const list=rows.slice();list.sort((a,b)=>compare(a,b,sortKey,sortAsc));return list}
  function norm(v){return String(v||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"")}

  function stableLeagueUserId(value){
    let h=2166136261;
    const text=String(value||"unknown");
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    return 9000000000000+h;
  }

  async function getJson(url){
    url.searchParams.set("v",Date.now());
    const r=await fetch(url,{cache:"no-store"});
    const data=await r.json();
    if(!r.ok||data.ok===false)throw new Error(data.message||"HTTP "+r.status);
    return data;
  }

  function snapshotTime(data){
    const ms=new Date(data?.snapshot_at||0).getTime();
    return Number.isFinite(ms)?ms:0;
  }

  async function fetchTopLeagueSnapshot(list){
    const url=new URL(API+"/api/leagues/top-leagues");
    url.searchParams.set("limit","1000");
    if(list)url.searchParams.set("list",list);
    addRunParam(url);
    return getJson(url);
  }

  async function fetchTopLeagueContext(){
    const [topData,allData]=await Promise.all([
      fetchTopLeagueSnapshot("top").catch(()=>null),
      fetchTopLeagueSnapshot("all").catch(()=>null)
    ]);
    if(!topData&&!allData)throw new Error("No stored top league snapshots are available.");
    const data=allData&&snapshotTime(allData)>snapshotTime(topData)?allData:topData;
    topLeagueHistoryName=data?.league_name||TOP_LEAGUES_NAME;
    const targetName=norm(currentData?.league_name||LEAGUE);
    const targetId=String(currentData?.league_id||"").trim();
    const topRows=data.rows||[];
    return topRows.find(r =>
      (targetId && String(r.league_id||"").trim()===targetId) ||
      norm(r.league_name||r.display_name)===targetName
    ) || null;
  }

  async function fetchRewardMilestones(){
    const url=new URL(API+"/api/leagues/milestones");
    url.searchParams.set("ranks",REWARD_TIERS.map(tier=>tier.end).join(","));
    addRunParam(url);
    const data=await getJson(url);
    return data.rows||[];
  }

  async function fetchMemberHistory(){
    const url=new URL(API+"/api/leagues/history");
    url.searchParams.set("league",API_LEAGUE);
    url.searchParams.set("hours","24");
    url.searchParams.set("limit","50000");
    addRunParam(url);
    const data=await getJson(url);
    return data.rows||[];
  }

  function renderCards(data){
    const list=data.rows||[];
    const leagueName=data.league_name||LEAGUE;
    currentData=data;
    document.title=leagueName+" League Tracker";
    const leaguePoints=data.league_points ?? topLeagueRow?.total_points ?? topLeagueRow?.points;
    const snapshotAt=data.snapshot_at || topLeagueRow?.fetched_at;
    document.getElementById("league-points").textContent=shortNum(leaguePoints);
    document.getElementById("league-points").title=fullNum(leaguePoints);
    document.getElementById("last-db-update").textContent=snapshotAt?dt(snapshotAt):"—";
    document.getElementById("page-title").textContent=leagueName+" League Tracker";
    const runLabel=document.getElementById("run-label");
    if(runLabel)runLabel.textContent=data.league_run_label||RUN_KEY;
    const currentRank=topLeagueRow?.rank||data.league_rank;
    const projectedRank=topLeagueRow?.projected_rank_1h;
    document.getElementById("league-rank").textContent=currentRank?"#"+currentRank:"—";
    document.getElementById("projected-rank").textContent=projectedRank?"#"+projectedRank:"—";
    const img=document.getElementById("league-icon"),src=iconUrl(data.league_icon || topLeagueRow?.league_icon);
    if(src){img.src=src;img.hidden=false}else img.hidden=true;
  }

  function numOrNull(v){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null}
  function teamPoints(){return numOrNull(currentData?.league_points) ?? numOrNull(topLeagueRow?.total_points)}
  function renderRewardMilestones(){
    const box=document.getElementById("race-summary");
    if(!box)return;
    if(!SHOW_RACE_SUMMARY){box.hidden=true;return}
    box.hidden=false;
    const thresholds=new Map(milestoneRows.map(row=>[Number(row.rank),row]));
    const points=teamPoints();
    const currentRank=numOrNull(topLeagueRow?.rank??currentData?.league_rank);
    const cards=REWARD_TIERS.map(tier=>{
      const threshold=thresholds.get(tier.end);
      const thresholdPoints=threshold?.available?numOrNull(threshold.points):null;
      const gap=points!=null&&thresholdPoints!=null?Math.max(0,Math.ceil(thresholdPoints-points+1)):null;
      const inTier=currentRank!=null&&currentRank>=tier.start&&currentRank<=tier.end;
      const surpassed=currentRank!=null&&currentRank<tier.start;
      const status=inTier?"Current":surpassed?"Passed":gap===0?"Qualified":gap==null?"Unavailable":"Need "+shortNum(gap);
      const statusClass=inTier?"current":surpassed||gap===0?"reached":gap==null?"unknown":"needed";
      const range=tier.start===tier.end?"#"+tier.start:"#"+tier.start+"–"+tier.end;
      const entry=thresholdPoints==null?"Entry points unavailable":fullNum(thresholdPoints)+" points at #"+tier.end;
      const gapTitle=gap==null?entry:fullNum(gap)+" more points required; "+entry;
      return '<article class="reward-milestone '+statusClass+'"><div class="reward-art-shell '+esc(tier.variant)+'"><img class="reward-art" src="'+esc(tier.image)+'" alt="'+esc(tier.reward)+'" loading="lazy"></div><div class="reward-copy"><div class="reward-title-row"><div class="reward-name">'+esc(tier.reward)+'</div><div class="reward-gap" title="'+esc(gapTitle)+'">'+esc(status)+'</div></div><div class="reward-rank">League '+esc(range)+'</div><div class="reward-threshold">'+esc(entry)+'</div></div></article>';
    }).join("");
    const context=currentRank==null?"Current placement unavailable":("Current placement #"+fullNum(currentRank)+(points==null?"":" · "+fullNum(points)+" points"));
    box.innerHTML='<div class="reward-milestone-heading"><div><strong>Reward Eligibility</strong><span>'+esc(context)+' · Exact entry requirements from the latest stored leaderboard</span></div><span class="squad-prize">Every squad member receives the prize</span></div><div class="reward-milestone-grid">'+cards+'</div>';
  }

  function growthSeries(){
    const roster=(currentData?.rows||rows||[]).slice().sort((a,b)=>(Number(a.rank)||999)-(Number(b.rank)||999));
    const historyTimes=memberHistoryRows.map(row=>new Date(row.fetched_at||0).getTime()).filter(Number.isFinite);
    const latest=Math.max(new Date(currentData?.snapshot_at||0).getTime()||0,...historyTimes,Date.now()-GROWTH_BUCKET_MS);
    const end=Math.ceil(latest/GROWTH_BUCKET_MS)*GROWTH_BUCKET_MS;
    const start=end-GROWTH_WINDOW_MS;
    const buckets=Array.from({length:97},(_,index)=>start+index*GROWTH_BUCKET_MS);
    const byUser=new Map();
    for(const row of memberHistoryRows){
      const id=String(row.user_id??"");
      const time=new Date(row.fetched_at||0).getTime();
      const points=numOrNull(row.points??row.total_points);
      if(!id||!Number.isFinite(time)||time<start-GROWTH_BUCKET_MS||time>end||points==null)continue;
      if(!byUser.has(id))byUser.set(id,[]);
      byUser.get(id).push({time,points});
    }
    return {
      start,end,buckets,
      series:roster.map((member,index)=>{
        const id=String(member.user_id??"");
        const samples=(byUser.get(id)||[]).sort((a,b)=>a.time-b.time);
        const values=new Array(buckets.length).fill(null);
        let sampleIndex=0,lastValue=null;
        for(let bucketIndex=0;bucketIndex<buckets.length;bucketIndex++){
          const bucketEnd=buckets[bucketIndex]+GROWTH_BUCKET_MS;
          while(sampleIndex<samples.length&&samples[sampleIndex].time<bucketEnd){lastValue=samples[sampleIndex].points;sampleIndex++}
          values[bucketIndex]=lastValue;
        }
        return {
          id,
          name:memberName(member),
          color:GROWTH_COLORS[index%GROWTH_COLORS.length],
          hidden:member.points_redacted===true,
          values:member.points_redacted===true?values.map(()=>null):values
        };
      })
    };
  }

  function growthTime(value){return new Date(value).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}
  function signedShort(value){const n=numOrNull(value);if(n==null)return"—";return(n>0?"+":"")+shortNum(n)}
  function renderGrowthLegend(chart){
    const legend=document.getElementById("member-growth-legend");
    const meta=document.getElementById("member-growth-meta");
    if(!legend||!meta)return;
    legend.innerHTML=chart.series.map(series=>{
      const known=series.values.filter(value=>value!=null);
      const gain=known.length>1?known[known.length-1]-known[0]:null;
      return '<span class="growth-legend-item'+(series.hidden?' hidden':'')+'" style="--series-color:'+series.color+'"><span class="growth-legend-dot"></span><span>'+esc(series.name)+(series.hidden?' · points hidden':'')+'</span>'+(series.hidden?'':'<strong>'+esc(signedShort(gain))+'</strong>')+'</span>';
    }).join("");
    const visible=chart.series.filter(series=>!series.hidden&&series.values.some(value=>value!=null)).length;
    meta.textContent=visible?"96 quarter-hour intervals · "+visible+" visible member"+(visible===1?"":"s"):"Waiting for stored point history";
  }

  function drawMemberGrowthChart(){
    const canvas=document.getElementById("member-growth-chart");
    const tooltip=document.getElementById("member-growth-tooltip");
    if(!canvas||!tooltip)return;
    const chart=growthSeries();
    renderGrowthLegend(chart);
    const rect=canvas.getBoundingClientRect();
    if(rect.width<20)return;
    const dpr=devicePixelRatio||1;
    canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);
    const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    const visible=chart.series.filter(series=>!series.hidden&&series.values.some(value=>value!=null));
    const all=visible.flatMap(series=>series.values.filter(value=>value!=null));
    if(!all.length){ctx.fillStyle="#8b949e";ctx.font="13px Arial";ctx.fillText("Not enough stored history to chart yet.",16,28);canvas._memberGrowth=null;return}
    const padL=70,padR=22,padT=18,padB=34,w=Math.max(1,rect.width-padL-padR),h=Math.max(1,rect.height-padT-padB);
    const minRaw=Math.min(...all),maxRaw=Math.max(...all),range=Math.max(1,maxRaw-minRaw),padding=Math.max(1,range*.08);
    const minP=Math.max(0,minRaw-padding),maxP=maxRaw+padding;
    const xIndex=index=>padL+(index/(chart.buckets.length-1))*w;
    const yValue=value=>padT+(1-(value-minP)/Math.max(1,maxP-minP))*h;
    ctx.font="11px Arial";ctx.lineWidth=1;ctx.strokeStyle="#30363d";ctx.fillStyle="#8b949e";
    for(let i=0;i<=4;i++){
      const y=padT+i*h/4,value=maxP-i*(maxP-minP)/4;
      ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(rect.width-padR,y);ctx.stroke();ctx.fillText(shortNum(value),8,y+4);
    }
    for(let i=0;i<=6;i++){
      const index=Math.round(i*(chart.buckets.length-1)/6),x=xIndex(index),label=growthTime(chart.buckets[index]);
      ctx.beginPath();ctx.moveTo(x,padT);ctx.lineTo(x,rect.height-padB);ctx.stroke();
      const width=ctx.measureText(label).width;ctx.fillText(label,Math.max(padL,Math.min(rect.width-padR-width,x-width/2)),rect.height-11);
    }
    for(const series of visible){
      ctx.strokeStyle=series.color;ctx.lineWidth=2;ctx.beginPath();let started=false,lastIndex=-1,lastValue=null;
      series.values.forEach((value,index)=>{
        if(value==null){started=false;lastValue=null;return}
        const x=xIndex(index),y=yValue(value);
        if(!started){ctx.moveTo(x,y);started=true}
        else{
          ctx.lineTo(x,yValue(lastValue));
          if(value!==lastValue)ctx.lineTo(x,y);
        }
        lastValue=value;lastIndex=index;
      });ctx.stroke();
      if(lastIndex>=0){ctx.fillStyle=series.color;ctx.beginPath();ctx.arc(xIndex(lastIndex),yValue(series.values[lastIndex]),3,0,Math.PI*2);ctx.fill()}
    }
    canvas._memberGrowth={...chart,visible,xIndex,yValue,padT,padB,rect};
    bindMemberGrowthTooltip(canvas,tooltip);
  }

  function bindMemberGrowthTooltip(canvas,tooltip){
    if(canvas.dataset.growthBound)return;
    canvas.dataset.growthBound="1";
    const hide=()=>{tooltip.style.display="none";drawMemberGrowthChart()};
    const move=event=>{
      const chart=canvas._memberGrowth;if(!chart)return;
      const rect=canvas.getBoundingClientRect();
      const localX=event.clientX-rect.left;
      const index=Math.max(0,Math.min(chart.buckets.length-1,Math.round(((localX-70)/Math.max(1,rect.width-92))*(chart.buckets.length-1))));
      drawMemberGrowthChart();const fresh=canvas._memberGrowth;if(!fresh)return;
      const ctx=canvas.getContext("2d"),x=fresh.xIndex(index);ctx.strokeStyle="#8b949e";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,fresh.padT);ctx.lineTo(x,rect.height-fresh.padB);ctx.stroke();
      const rowsHtml=fresh.series.map(series=>{
        const value=series.values[index],previous=index>0?series.values[index-1]:null;
        const change=value!=null&&previous!=null?value-previous:null;
        const detail=series.hidden?'Hidden':value==null?'—':fullNum(value)+(change==null?'':' ('+signedShort(change)+')');
        return '<div class="growth-tip-row" style="--series-color:'+series.color+'"><span class="growth-tip-name">'+esc(series.name)+'</span><strong>'+esc(detail)+'</strong></div>';
      }).join("");
      tooltip.innerHTML='<div class="growth-tip-time">'+esc(new Date(fresh.buckets[index]).toLocaleString([], {weekday:"short",hour:"numeric",minute:"2-digit"}))+'</div>'+rowsHtml;
      tooltip.style.display="block";
      const tipWidth=tooltip.offsetWidth,tipHeight=tooltip.offsetHeight;
      tooltip.style.left=Math.max(6,Math.min(rect.width-tipWidth-6,x+12))+"px";
      tooltip.style.top=Math.max(6,Math.min(rect.height-tipHeight-6,(event.clientY-rect.top)-tipHeight/2))+"px";
    };
    canvas.addEventListener("mousemove",move);canvas.addEventListener("mouseleave",hide);
    canvas.addEventListener("touchstart",event=>event.touches?.[0]&&move(event.touches[0]),{passive:true});
    canvas.addEventListener("touchmove",event=>event.touches?.[0]&&move(event.touches[0]),{passive:true});
    canvas.addEventListener("touchend",hide);
  }

  function render(){
    const tbody=document.getElementById("members-tbody");
    renderRewardMilestones();
    requestAnimationFrame(drawMemberGrowthChart);
    const list=visible();
    const capacity=Math.max(4,Math.min(20,Number(currentData?.member_capacity)||4),list.length);
    const roster=list.slice();
    while(roster.length<capacity)roster.push(null);
    tbody.innerHTML=roster.map((r,index)=>{
      if(!r)return '<tr class="empty-roster-slot"><td class="rank">#'+(index+1)+'</td><td><span>Open member slot</span></td><td class="numeric">—</td><td class="numeric">—</td><td class="numeric">—</td><td class="numeric">—</td><td class="numeric">—</td><td class="numeric">—</td></tr>';
      const name=memberName(r);
      return '<tr><td class="rank">#'+esc(r.rank)+'</td><td><div class="player-cell"><a class="player-link" href="'+profileHref(r)+'">'+avatar(r)+'<span><span>'+esc(name)+'</span><div class="meta">'+esc(r.user_id)+'</div></span></a></div></td><td class="numeric" title="'+esc(fullNum(r.total_points))+'">'+esc(shortNum(r.total_points))+'</td><td class="numeric">'+delta(r.gain_5m)+'</td><td class="numeric">'+delta(r.gain_1h)+'</td><td class="numeric">'+delta(r.gain_6h)+'</td><td class="numeric">'+delta(r.gain_12h)+'</td><td class="numeric">'+delta(r.gain_24h)+'</td></tr>'
    }).join("");
    renderLeagueRankLog();
  }

  function showError(msg){document.getElementById("members-tbody").innerHTML='<tr><td colspan="8" class="error">'+esc(msg)+'</td></tr>'}

  async function fetchLeagueRankHistory(){
    const stable=currentData?.league_id||topLeagueRow?.league_id||currentData?.league_name||LEAGUE;
    const syntheticId=stableLeagueUserId(stable);
    const url=new URL(API+"/api/leagues/history");
    url.searchParams.set("league",topLeagueHistoryName||TOP_LEAGUES_NAME);
    url.searchParams.set("user_id",String(syntheticId));
    url.searchParams.set("hours","all");
    url.searchParams.set("limit","50000");
    addRunParam(url);
    const data=await getJson(url);
    return data.rows||[];
  }

  function dedupeRankRows(rows){
    const byTime=new Map();
    for(const r of rows){
      if(!r || r.rank==null || !r.fetched_at)continue;
      const t=new Date(r.fetched_at).getTime();
      if(!Number.isFinite(t))continue;
      byTime.set(t,{t,fetched_at:r.fetched_at,rank:Number(r.rank),points:Number(r.points)});
    }
    return [...byTime.values()].sort((a,b)=>a.t-b.t);
  }

  function buildLeagueRankLog(){
    const clean=dedupeRankRows(leagueRankHistoryRows);
    const events=[];
    let last=null;
    for(const row of clean){
      if(!last){last=row;continue}
      if(row.rank!==last.rank){
        events.push({t:row.t,fetched_at:row.fetched_at,from:last.rank,to:row.rank,direction:row.rank<last.rank?"up":"down",points:Number.isFinite(row.points)?row.points:null});
      }
      last=row;
    }
    events.sort((a,b)=>b.t-a.t);
    return events;
  }

  function renderLeagueRankLog(){
    const box=document.getElementById("rank-log-list");
    const count=document.getElementById("rank-log-count");
    if(!box)return;
    const events=buildLeagueRankLog();
    if(count)count.textContent=events.length?events.length.toLocaleString("en-US")+" league rank changes":"No league rank changes";
    if(!events.length){box.innerHTML='<div class="rank-log-empty">No league rank up/down changes found yet. This depends on stored Top 1000 League snapshots.</div>';return}
    const name=currentData?.league_name||LEAGUE;
    box.innerHTML=events.slice(0,80).map(ev=>{
      const cls=ev.direction==="up"?"positive":"negative";
      const word=ev.direction==="up"?"ranked up":"ranked down";
      const arrow=ev.direction==="up"?"↑":"↓";
      return '<div class="rank-log-item '+cls+'"><span class="rank-log-time">'+esc(dt(ev.fetched_at))+'</span><span class="rank-log-main"><strong>'+esc(name)+'</strong> '+word+' <strong>#'+esc(ev.from)+' → #'+esc(ev.to)+'</strong> '+arrow+'</span><span class="rank-log-rank">'+esc(ev.points==null?"":shortNum(ev.points))+'</span></div>';
    }).join("");
  }

  async function loadData(){
    if(loading)return;loading=true;
    try{
      const currentUrl=new URL(API+"/api/leagues/current");
      currentUrl.searchParams.set("league",API_LEAGUE);
      addRunParam(currentUrl);
      const current=await getJson(currentUrl);
      rows=current.rows||[];
      currentData=current;
      if(current.public_visibility==="hidden"){
        topLeagueRow=null;
        milestoneRows=[];
        memberHistoryRows=[];
        leagueRankHistoryRows=[];
        renderCards(current);
        render();
        return;
      }
      const [top,milestones]=await Promise.all([
        fetchTopLeagueContext().catch(err=>{console.warn("Projected rank unavailable",err);return null}),
        fetchRewardMilestones().catch(err=>{console.warn("Reward milestones unavailable",err);return []})
      ]);
      topLeagueRow=top;
      milestoneRows=milestones;
      renderCards(current);
      render();
      const [rankHistory,memberHistory]=await Promise.all([
        fetchLeagueRankHistory().catch(err=>{console.warn("League rank history unavailable",err);return []}),
        fetchMemberHistory().catch(err=>{console.warn("Member growth history unavailable",err);return []})
      ]);
      leagueRankHistoryRows=rankHistory;
      memberHistoryRows=memberHistory;
      render();
    }catch(e){console.error(e);showError(e.message||String(e))}
    finally{loading=false}
  }

  document.getElementById("refresh-btn").addEventListener("click",loadData);
  document.querySelectorAll("th[data-sort]").forEach(th=>th.addEventListener("click",()=>{
    const k=th.dataset.sort;
    if(sortKey===k)sortAsc=!sortAsc;
    else{sortKey=k;sortAsc=k==="rank"||k==="display_name"}
    render();
  }));
  addEventListener("resize",()=>setTimeout(drawMemberGrowthChart,100));
  loadData();
  setInterval(loadData,REFRESH_INTERVAL_MS);
})();
