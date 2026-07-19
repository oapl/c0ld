(function(){
  "use strict";

  const config=window.LEAGUE_CONFIG||{};
  const league=String(config.league||"").trim().toLowerCase();
  if(league!=="dezzz")return;

  const section=document.getElementById("hourly-pet-gains");
  const tbody=document.getElementById("hourly-pet-gains-body");
  const meta=document.getElementById("hourly-pet-gains-meta");
  const memberSelect=document.getElementById("hourly-pet-member-select");
  const title=document.getElementById("hourly-pet-gains-title");
  const periodLabel=document.getElementById("hourly-pet-period-label");
  const viewButtons=[...document.querySelectorAll("[data-pet-view]")];
  if(!section||!tbody||!meta||!memberSelect||!title||!periodLabel)return;

  const INVENTORY_API="https://inventory-detector-worker.opal-dde.workers.dev";
  const LEAGUE_API="https://yamo-league-api-worker.opal-dde.workers.dev";
  const DEFAULT_USER_ID="109818";
  const DEFAULT_USERNAME="Cinnamowopal";
  const HOURS=24;
  let requestVersion=0;
  let activeView="hourly";
  const PETS=[
    {key:"elephant",name:"War Elephant"},
    {key:"jaguar",name:"Warrior Jaguar"},
    {key:"peacock",name:"Jewel Peacock"},
    {key:"genie",name:"Genie Fox"}
  ];

  function esc(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]))}
  function count(value){const number=Number(value);return Number.isFinite(number)&&number>0?Math.floor(number):0}
  function formatCount(value){return Number(value||0).toLocaleString("en-US")}
  function petName(row){return String(row?.item_id||row?.display_name||"").trim().toLowerCase()}
  function usableName(value,userId){const name=String(value||"").trim(),id=String(userId||"");return name&&name!==id&&!/^user_?\d+$/i.test(name)?name:""}
  function selectedName(){const option=memberSelect.selectedOptions?.[0];return option?.dataset?.name||option?.textContent||memberSelect.value}
  function hourLabel(row){
    const start=new Date(row?.period_start||0),end=new Date(row?.period_end||0);
    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))return "Unknown hour";
    const day=start.toLocaleDateString([], {month:"short",day:"numeric"});
    const startTime=start.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
    const endTime=end.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
    return day+" · "+startTime+"–"+endTime;
  }
  function summarize(row){
    const totals={elephant:0,jaguar:0,peacock:0,genie:0};
    for(const item of row?.gained||[]){
      const name=petName(item),pet=PETS.find(candidate=>candidate.name.toLowerCase()===name);
      if(pet)totals[pet.key]+=count(item.delta);
    }
    return {...row,totals,total:Object.values(totals).reduce((sum,value)=>sum+value,0)};
  }
  function gainCell(value,total=false){
    const number=count(value),klass=number?"pet-gain":"pet-zero";
    return '<td class="numeric '+klass+(total?' pet-total':'')+'">'+(number?"+":"")+esc(formatCount(number))+'</td>';
  }
  function renderHourly(rows,username){
    const windows=(rows||[]).map(summarize).reverse();
    title.textContent="Hourly Pet Gains";
    periodLabel.textContent="Hour";
    meta.textContent=username+" · "+windows.length+" completed hour"+(windows.length===1?"":"s")+" · variants combined";
    if(!windows.length){tbody.innerHTML='<tr><td colspan="6" class="empty">No completed inventory hours are available yet.</td></tr>';return}
    tbody.innerHTML=windows.map(row=>'<tr><td>'+esc(hourLabel(row))+'</td>'+PETS.map(pet=>gainCell(row.totals[pet.key])).join("")+gainCell(row.total,true)+'</tr>').join("");
  }
  function inventoryCount(value){
    const number=Number(value);
    return Number.isFinite(number)&&number>0?Math.floor(number):0;
  }
  function summarizeInventory(items){
    const totals={elephant:0,jaguar:0,peacock:0,genie:0};
    for(const item of items||[]){
      const name=petName(item),pet=PETS.find(candidate=>candidate.name.toLowerCase()===name);
      if(pet)totals[pet.key]+=inventoryCount(item.count??item.amount??item.quantity??item.qty);
    }
    return {totals,total:Object.values(totals).reduce((sum,value)=>sum+value,0)};
  }
  function totalCell(value,total=false){
    const number=inventoryCount(value),klass=number?"":"pet-zero";
    return '<td class="numeric '+klass+(total?' pet-total':'')+'">'+esc(formatCount(number))+'</td>';
  }
  function renderTotals(data,username){
    const summary=summarizeInventory(data.items||[]);
    const captured=new Date(data.snapshot?.captured_at||0);
    const stamp=Number.isNaN(captured.getTime())?"Latest snapshot":captured.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    title.textContent="Inventory Pet Totals";
    periodLabel.textContent="Snapshot";
    meta.textContent=username+" · latest stored inventory · variants combined";
    tbody.innerHTML='<tr><td>'+esc(stamp)+'</td>'+PETS.map(pet=>totalCell(summary.totals[pet.key])).join("")+totalCell(summary.total,true)+'</tr>';
  }
  async function resolveRobloxNames(userIds){
    const names=new Map();
    try{
      const response=await fetch("https://users.roblox.com/v1/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userIds:userIds.map(Number),excludeBannedUsers:false})});
      const data=await response.json();
      if(!response.ok)throw new Error("Roblox username request failed");
      for(const user of data.data||[])names.set(String(user.id),String(user.name||user.displayName||user.id));
    }catch(error){console.warn("League member usernames unavailable",error)}
    return names;
  }
  async function loadRoster(){
    try{
      const url=new URL(LEAGUE_API+"/api/leagues/current");
      url.searchParams.set("league",String(config.apiLeague||config.league||"dezzz"));
      if(config.run)url.searchParams.set("run",String(config.run));
      url.searchParams.set("v",Date.now());
      const response=await fetch(url,{cache:"no-store"}),data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.message||"League roster request failed");
      const members=(data.rows||[]).slice().sort((a,b)=>(Number(a.rank)||999)-(Number(b.rank)||999));
      if(!members.some(member=>String(member.user_id)===DEFAULT_USER_ID))members.push({user_id:DEFAULT_USER_ID,username:DEFAULT_USERNAME,display_name:DEFAULT_USERNAME,rank:null});
      const names=await resolveRobloxNames(members.map(member=>String(member.user_id)).filter(Boolean));
      const previous=memberSelect.value||DEFAULT_USER_ID;
      memberSelect.innerHTML="";
      for(const member of members){
        const userId=String(member.user_id||"").trim();
        if(!userId)continue;
        const name=names.get(userId)||usableName(member.username,userId)||usableName(member.display_name,userId)||(userId===DEFAULT_USER_ID?DEFAULT_USERNAME:"User "+userId);
        const option=document.createElement("option");
        option.value=userId;option.dataset.name=name;option.textContent=(member.rank?"#"+member.rank+" · ":"")+name;
        memberSelect.appendChild(option);
      }
      memberSelect.value=[...memberSelect.options].some(option=>option.value===previous)?previous:DEFAULT_USER_ID;
    }catch(error){console.warn("League roster unavailable",error)}
  }
  async function load(userId=memberSelect.value||DEFAULT_USER_ID){
    const version=++requestVersion,username=selectedName();
    meta.textContent="Loading "+username+"...";
    tbody.innerHTML='<tr><td colspan="6" class="empty">Loading inventory data...</td></tr>';
    try{
      const path=activeView==="totals"?"/api/inventory/latest":"/api/inventory/hourly";
      const url=new URL(INVENTORY_API+path);
      url.searchParams.set("user_id",String(userId));
      if(activeView==="totals")url.searchParams.set("include_items","1");
      else url.searchParams.set("hours",String(HOURS));
      url.searchParams.set("v",Date.now());
      const response=await fetch(url,{cache:"no-store"});
      const data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.message||"Inventory request failed");
      if(version!==requestVersion)return;
      if(activeView==="totals")renderTotals(data,username);
      else renderHourly(data.rows||[],username);
    }catch(error){
      if(version!==requestVersion)return;
      console.error("Pet inventory unavailable",error);
      title.textContent=activeView==="totals"?"Inventory Pet Totals":"Hourly Pet Gains";
      periodLabel.textContent=activeView==="totals"?"Snapshot":"Hour";
      meta.textContent=username+" · no inventory history";
      tbody.innerHTML='<tr><td colspan="6" class="empty">No inventory snapshots are available for '+esc(username)+' yet.</td></tr>';
    }
  }

  function setView(view){
    activeView=view==="totals"?"totals":"hourly";
    for(const button of viewButtons)button.classList.toggle("active",button.dataset.petView===activeView);
    load(memberSelect.value||DEFAULT_USER_ID);
  }

  async function init(){
    section.hidden=false;
    await loadRoster();
    memberSelect.addEventListener("change",()=>load(memberSelect.value));
    for(const button of viewButtons)button.addEventListener("click",()=>setView(button.dataset.petView));
    load(memberSelect.value||DEFAULT_USER_ID);
  }

  init();
})();
