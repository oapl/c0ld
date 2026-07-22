(function(){
  "use strict";

  const config=window.LEAGUE_CONFIG||{};
  const league=String(config.league||"").trim().toLowerCase();
  if(!league)return;

  const section=document.getElementById("hourly-pet-gains");
  const tbody=document.getElementById("hourly-pet-gains-body");
  const meta=document.getElementById("hourly-pet-gains-meta");
  const memberSelect=document.getElementById("hourly-pet-member-select");
  const title=document.getElementById("hourly-pet-gains-title");
  const periodLabel=document.getElementById("hourly-pet-period-label");
  const connectButton=document.getElementById("hourly-pet-connect");
  const connectStatus=document.getElementById("hourly-pet-connect-status");
  const viewButtons=[...document.querySelectorAll("[data-pet-view]")];
  if(!section||!tbody||!meta||!memberSelect||!title||!periodLabel||!connectButton||!connectStatus)return;

  const INVENTORY_API="https://inventory-detector-worker.opal-dde.workers.dev";
  const LEAGUE_API="https://yamo-league-api-worker.opal-dde.workers.dev";
  const CONNECTED_APPS_URL="https://db.biggames.io/settings/connected-apps";
  const AUTH_USER_STORAGE_KEY="c0ld:inventory-authorized-user";
  const HOURS=24;
  let requestVersion=0;
  let activeView="hourly";
  let connected=false;
  let authorizedUserId=String(localStorage.getItem(AUTH_USER_STORAGE_KEY)||"").trim();
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
  function usableName(value,userId){const name=String(value||"").trim(),id=String(userId||"");return name&&name!==id&&!/^user[ _-]?\d+$/i.test(name)?name:""}
  function selectedName(){const option=memberSelect.selectedOptions?.[0];return option?.dataset?.name||option?.textContent||memberSelect.value}
  function leagueKey(value){return String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"")}
  function oauthReturnUrl(){const url=new URL(location.href);url.searchParams.delete("inventory_oauth");url.searchParams.delete("inventory_message");url.searchParams.delete("user_id");url.searchParams.delete("pulled");url.searchParams.delete("forced");url.searchParams.delete("snapshot_at");url.searchParams.delete("connected");return url.toString()}
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
      const names=await resolveRobloxNames(members.map(member=>String(member.user_id)).filter(Boolean));
      const previous=authorizedUserId||memberSelect.value;
      memberSelect.innerHTML="";
      for(const member of members){
        const userId=String(member.user_id||"").trim();
        if(!userId)continue;
        const name=names.get(userId)||usableName(member.username,userId)||usableName(member.display_name,userId)||"User "+userId;
        const option=document.createElement("option");
        option.value=userId;option.dataset.name=name;option.textContent=(member.rank?"#"+member.rank+" · ":"")+name;
        memberSelect.appendChild(option);
      }
      if(!memberSelect.options.length){memberSelect.innerHTML='<option value="">No league members found</option>';return}
      memberSelect.value=[...memberSelect.options].some(option=>option.value===previous)?previous:memberSelect.options[0].value;
    }catch(error){console.warn("League roster unavailable",error);memberSelect.innerHTML='<option value="">Roster unavailable</option>'}
  }
  async function loadAccessStatus(){
    if(!authorizedUserId){
      connected=false;connectButton.disabled=false;connectButton.textContent="Connect Your Inventory";connectButton.classList.remove("connected");connectButton.title="Authorize your own Roblox inventory";connectStatus.className="meta";connectStatus.textContent="Connect the Roblox account you are currently signed into at BIG Games.";return;
    }
    connectButton.disabled=true;
    connectStatus.className="meta";
    connectStatus.textContent="Checking your saved inventory access...";
    try{
      const url=new URL(INVENTORY_API+"/api/inventory/oauth/status");url.searchParams.set("user_id",authorizedUserId);url.searchParams.set("v",Date.now());
      const response=await fetch(url,{cache:"no-store"}),data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.message||"Inventory access check failed");
      connected=!!data.connected;
      if(!connected){localStorage.removeItem(AUTH_USER_STORAGE_KEY);authorizedUserId=""}
      connectButton.textContent=connected?"Revoke Inventory Access":"Connect Your Inventory";
      connectButton.classList.toggle("connected",connected);
      connectButton.title=connected?"Open BIG Games Connected Apps to revoke this authorization":"Authorize your own Roblox inventory";
      connectStatus.className="meta"+(connected?" connected":"");
      connectStatus.textContent=connected?"Your Roblox account is opted in":"Connect the Roblox account you are currently signed into at BIG Games.";
    }catch(error){
      connected=false;connectButton.textContent="Connect Your Inventory";connectButton.classList.remove("connected");connectStatus.className="meta error";connectStatus.textContent=error.message||String(error);
    }finally{connectButton.disabled=false}
  }
  async function connectSelectedMember(){
    if(connected){window.open(CONNECTED_APPS_URL,"_blank","noopener,noreferrer");return}
    const userId=String(memberSelect.value||"").trim();
    const username=String(selectedName()||"").trim();
    if(!userId){connectStatus.className="meta error";connectStatus.textContent="Select your Roblox account from the league roster first.";return}
    connectButton.disabled=true;connectButton.textContent="Preparing approval...";connectStatus.className="meta";connectStatus.textContent="Connecting "+username+" through the secure BIG Games approval page...";
    try{
      const params=new URLSearchParams({user_id:userId,username,league:String(config.apiLeague||config.league||""),run:String(config.run||""),return_url:oauthReturnUrl()});
      const response=await fetch(INVENTORY_API+"/api/inventory/oauth/start?"+params,{method:"POST",headers:{"content-type":"application/json"},cache:"no-store"});
      const data=await response.json();if(!response.ok||data.ok===false)throw new Error(data.message||"Inventory approval could not be started");
      location.assign(data.authorize_url);
    }catch(error){connectButton.disabled=false;connectButton.textContent=connected?"Revoke Inventory Access":"Connect Your Inventory";connectStatus.className="meta error";connectStatus.textContent=error.message||String(error)}
  }
  async function consumeOAuthResult(){
    const params=new URLSearchParams(location.search),result=params.get("inventory_oauth");if(!result)return;
    const userId=String(params.get("user_id")||"").trim();
    if(result==="connected"&&userId){
      authorizedUserId=userId;localStorage.setItem(AUTH_USER_STORAGE_KEY,userId);
      try{
        const lookup=new URL(LEAGUE_API+"/api/leagues/player-location");lookup.searchParams.set("user_id",userId);if(config.run)lookup.searchParams.set("run",String(config.run));lookup.searchParams.set("v",Date.now());
        const response=await fetch(lookup,{cache:"no-store"}),data=await response.json();
        if(response.ok&&data.ok!==false&&data.found&&leagueKey(data.league_name)!==leagueKey(config.apiLeague||config.league)){
          const target=new URL("league.html",location.href);target.searchParams.set("league",String(data.league_name));if(config.run)target.searchParams.set("run",String(config.run));target.searchParams.set("inventory_oauth","connected");target.searchParams.set("user_id",userId);target.searchParams.set("inventory_message",params.get("inventory_message")||"Inventory access connected.");location.replace(target.toString());return true;
        }
      }catch(error){console.warn("Could not locate the authorized player's current league",error)}
    }
    connectStatus.className="meta "+(result==="connected"?"connected":"error");
    connectStatus.textContent=params.get("inventory_message")||(result==="connected"?"Inventory access connected.":"Inventory authorization failed.");
    history.replaceState({},document.title,oauthReturnUrl());
    return false;
  }
  async function load(userId=memberSelect.value){
    if(!userId){meta.textContent="No league member selected";tbody.innerHTML='<tr><td colspan="6" class="empty">No league members are available.</td></tr>';return}
    const version=++requestVersion,username=selectedName();
    meta.textContent="Loading "+username+"...";
    tbody.innerHTML='<tr><td colspan="6" class="empty">Loading inventory data...</td></tr>';
    try{
      const path=activeView==="totals"?"/api/inventory/latest":"/api/inventory/hourly";
      const url=new URL(INVENTORY_API+path);
      url.searchParams.set("user_id",String(userId));
      if(activeView==="totals")url.searchParams.set("include_items","1");
      else {url.searchParams.set("hours",String(HOURS));url.searchParams.set("synchronized","1")}
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
    load(memberSelect.value);
  }

  async function init(){
    section.hidden=false;
    if(await consumeOAuthResult())return;
    await loadRoster();
    memberSelect.addEventListener("change",()=>load(memberSelect.value));
    connectButton.addEventListener("click",connectSelectedMember);
    for(const button of viewButtons)button.addEventListener("click",()=>setView(button.dataset.petView));
    loadAccessStatus();
    load(memberSelect.value);
  }

  init();
})();
