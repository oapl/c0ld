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
  const headRow=document.getElementById("hourly-pet-gains-head");
  const connectButton=document.getElementById("hourly-pet-connect");
  const connectStatus=document.getElementById("hourly-pet-connect-status");
  const viewButtons=[...document.querySelectorAll("[data-pet-view]")];
  if(!section||!tbody||!meta||!memberSelect||!title||!headRow||!connectButton||!connectStatus)return;

  const INVENTORY_API="https://inventory-detector-worker.opal-dde.workers.dev";
  const LEAGUE_API="https://yamo-league-api-worker.opal-dde.workers.dev";
  const CONNECTED_APPS_URL="https://db.biggames.io/settings/connected-apps";
  const AUTH_USER_STORAGE_KEY="c0ld:inventory-authorized-user";
  const HOURS=24;
  let requestVersion=0;
  let accessRequestVersion=0;
  let activeView="hourly";
  let connected=false;
  let snapshotReady=false;
  let snapshotState="unknown";
  let hourlyReady=false;
  let authorizedUserId=String(localStorage.getItem(AUTH_USER_STORAGE_KEY)||"").trim();
  const PETS=[
    {key:"elephant",name:"War Elephant"},
    {key:"jaguar",name:"Warrior Jaguar"},
    {key:"peacock",name:"Jewel Peacock"},
    {key:"genie",name:"Genie Fox"}
  ];
  const TOTAL_COLUMNS=[{key:"other",name:"Other"},...PETS];
  const EVENT_PET_NAMES=new Set([
    "Caveman Bear","Mammoth Elephant","Bastet Cat","Horus Falcon",
    "Triumphant Eagle","Legionary Bear","Fenrir Wolf","Druid Owl",
    "Knight Corgi","Crusader Dragon","Temple Toucan","Naga Cobra",
    "War Elephant","Warrior Jaguar","Steppe Wolf","Samurai Kitsune",
    "Jewel Peacock","Genie Fox"
  ].map(name=>name.toLowerCase()));

  function esc(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]))}
  function count(value){const number=Number(value);return Number.isFinite(number)&&number>0?Math.floor(number):0}
  function formatCount(value){return Number(value||0).toLocaleString("en-US")}
  function petName(row){return String(row?.item_id||row?.display_name||"").trim().toLowerCase()}
  function usableName(value,userId){const name=String(value||"").trim(),id=String(userId||"");return name&&name!==id&&!/^user[ _-]?\d+$/i.test(name)?name:""}
  function selectedUserId(){return String(memberSelect.value||"").trim()}
  function selectedName(){const option=memberSelect.selectedOptions?.[0];return option?.dataset?.name||option?.textContent||memberSelect.value}
  function selectedIsAuthorized(){return connected}
  function columnCount(){return activeView==="totals"?7:6}
  function emptyRow(message){return '<tr><td colspan="'+columnCount()+'" class="empty">'+esc(message)+'</td></tr>'}
  function renderHead(){
    const columns=activeView==="totals"?TOTAL_COLUMNS:PETS;
    headRow.innerHTML='<th id="hourly-pet-period-label">'+(activeView==="totals"?"Snapshot":"Hour")+'</th>'+columns.map(pet=>'<th class="numeric">'+esc(pet.name)+'</th>').join("")+'<th class="numeric">Total</th>';
  }
  function applyViewButtons(){for(const button of viewButtons)button.classList.toggle("active",button.dataset.petView===activeView)}
  function leagueKey(value){return String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"")}
  function oauthReturnUrl(){
    const url=new URL(location.href);
    for(const key of ["inventory_oauth","inventory_message","user_id","pulled","forced","snapshot_at","connected","snapshot_ready","snapshot_state"])url.searchParams.delete(key);
    return url.toString();
  }
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
    if(!windows.length){
      if(selectedIsAuthorized()&&connected&&snapshotReady){
        meta.textContent=username+" · first snapshot saved · waiting for two scheduled scans";
        tbody.innerHTML=emptyRow("Inventory totals are ready. Hourly gains appear after two scheduled hourly scans create a comparison window.");
      }else if(selectedIsAuthorized()&&connected&&!snapshotReady){
        meta.textContent=username+" · authorization saved · snapshot missing";
        tbody.innerHTML=emptyRow("BIG Games authorization is connected, but no inventory snapshot was saved. Use Retry Inventory Pull.");
      }else{
        meta.textContent=username+" · no completed hourly comparisons";
        tbody.innerHTML=emptyRow("No completed inventory hours are available yet.");
      }
      return;
    }
    hourlyReady=true;
    meta.textContent=username+" · "+windows.length+" completed hour"+(windows.length===1?"":"s")+" · variants combined";
    tbody.innerHTML=windows.map(row=>'<tr><td>'+esc(hourLabel(row))+'</td>'+PETS.map(pet=>gainCell(row.totals[pet.key])).join("")+gainCell(row.total,true)+'</tr>').join("");
  }
  function inventoryCount(value){
    const number=Number(value);
    return Number.isFinite(number)&&number>0?Math.floor(number):0;
  }
  function summarizeInventory(items){
    const totals={other:0,elephant:0,jaguar:0,peacock:0,genie:0};
    for(const item of items||[]){
      const name=petName(item),pet=PETS.find(candidate=>candidate.name.toLowerCase()===name);
      if(pet)totals[pet.key]+=inventoryCount(item.count??item.amount??item.quantity??item.qty);
      else if(EVENT_PET_NAMES.has(name))totals.other+=inventoryCount(item.count??item.amount??item.quantity??item.qty);
    }
    return {totals,total:Object.values(totals).reduce((sum,value)=>sum+value,0)};
  }
  function totalCell(entry,total=false,damageAvailable=false,damageComplete=true){
    const number=inventoryCount(entry?.count??entry),klass=number?"":"pet-zero";
    const percent=Number(entry?.damage_percent);
    const damage=damageAvailable&&Number.isFinite(percent)
      ? '<div class="pet-damage-share'+(damageComplete?'':' partial')+'">'+esc(percent.toFixed(percent>=10?1:2))+'% damage'+(damageComplete?'':'*')+'</div>'
      : '<div class="pet-damage-share unavailable">Damage unavailable</div>';
    return '<td class="numeric '+klass+(total?' pet-total':'')+'"><div class="pet-count">'+esc(formatCount(number))+'</div>'+damage+'</td>';
  }
  function renderTotals(data,username){
    snapshotReady=true;snapshotState="ready";
    const fallback=summarizeInventory(data.items||[]),damage=data.damage_summary||null;
    const categoryMap=new Map((damage?.categories||[]).map(category=>[category.key,category]));
    const categories=TOTAL_COLUMNS.map(column=>categoryMap.get(column.key)||{key:column.key,name:column.name,count:fallback.totals[column.key],damage_percent:null});
    const summary={total:damage?.total_count??fallback.total,categories};
    const captured=new Date(data.snapshot?.captured_at||0);
    const stamp=Number.isNaN(captured.getTime())?"Latest snapshot":captured.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    title.textContent="Owned Event Pet Totals";
    const detail=damage?.message?" · "+damage.message:"";
    meta.textContent=username+" · all owned event pets, not Your Team · variants combined"+detail;
    meta.title=damage?.source?"Damage source: "+damage.source:"";
    const totalEntry={count:summary.total,damage_percent:damage?.available?100:null};
    tbody.innerHTML='<tr><td>'+esc(stamp)+'</td>'+summary.categories.map(category=>totalCell(category,false,!!damage?.available,damage?.complete!==false)).join("")+totalCell(totalEntry,true,!!damage?.available,damage?.complete!==false)+'</tr>';
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
  function applyConnectionUi(message=""){
    const userId=selectedUserId(),username=selectedName();
    const accountLabel=username+(userId?" (Roblox "+userId+")":"");
    connectButton.disabled=false;
    connectButton.classList.toggle("connected",connected);
    if(!connected){
      connectButton.textContent="Connect Your Inventory";
      connectButton.title="Authorize inventory for "+accountLabel;
      connectStatus.className="meta";
      connectStatus.textContent=message||"Connect inventory for "+accountLabel+". Sign into this exact Roblox account at BIG Games before approving.";
      return;
    }
    if(!snapshotReady){
      connectButton.textContent="Retry Inventory Pull";
      connectButton.title="Retry the first inventory snapshot without requesting a forced BIG Games refresh";
      connectStatus.className="meta error";
      connectStatus.textContent=message||accountLabel+" is authorized, but no inventory snapshot exists yet. Retry the inventory pull.";
      return;
    }
    connectButton.textContent="Revoke Inventory Access";
    connectButton.title="Open BIG Games Connected Apps to revoke this authorization";
    connectStatus.className="meta connected";
    connectStatus.textContent=message||(hourlyReady
      ? accountLabel+" is connected. Totals and hourly gains are available."
      : accountLabel+" is connected. Totals are ready; hourly gains appear after two scheduled scans.");
  }
  async function probeSnapshotState(userId){
    const url=new URL(INVENTORY_API+"/api/inventory/latest");
    url.searchParams.set("user_id",userId);url.searchParams.set("include_items","0");url.searchParams.set("v",Date.now());
    const response=await fetch(url,{cache:"no-store"});
    if(response.status===404)return {snapshot_ready:false,snapshot_state:"missing",hourly_ready:false};
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||"Snapshot status check failed");
    return {snapshot_ready:true,snapshot_state:"ready",hourly_ready:false};
  }
  async function loadAccessStatus(){
    const version=++accessRequestVersion;
    const userId=selectedUserId();
    if(!userId){
      connected=false;snapshotReady=false;snapshotState="disconnected";hourlyReady=false;applyConnectionUi();return;
    }
    connectButton.disabled=true;
    connectStatus.className="meta";
    connectStatus.textContent="Checking saved inventory access for "+selectedName()+"...";
    try{
      const url=new URL(INVENTORY_API+"/api/inventory/oauth/status");url.searchParams.set("user_id",userId);url.searchParams.set("v",Date.now());
      const response=await fetch(url,{cache:"no-store"}),data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.message||"Inventory access check failed");
      if(version!==accessRequestVersion||userId!==selectedUserId())return;
      connected=!!data.connected;
      if(!connected){
        if(userId===authorizedUserId){localStorage.removeItem(AUTH_USER_STORAGE_KEY);authorizedUserId=""}
        snapshotReady=false;snapshotState="disconnected";hourlyReady=false;applyConnectionUi();return;
      }
      const state=data.snapshot_ready===undefined?await probeSnapshotState(userId):data;
      if(version!==accessRequestVersion||userId!==selectedUserId())return;
      snapshotReady=!!state.snapshot_ready;
      snapshotState=String(state.snapshot_state|| (snapshotReady?"ready":"missing"));
      hourlyReady=!!state.hourly_ready;
      applyConnectionUi(state.snapshot_error||"");
    }catch(error){
      if(version!==accessRequestVersion||userId!==selectedUserId())return;
      connected=false;snapshotReady=false;hourlyReady=false;connectButton.textContent="Connect Your Inventory";connectButton.classList.remove("connected");connectStatus.className="meta error";connectStatus.textContent=error.message||String(error);connectButton.disabled=false;
    }
  }
  async function retryInventoryPull(){
    const userId=selectedUserId();
    if(!userId)return;
    connectButton.disabled=true;connectButton.textContent="Retrying inventory...";connectStatus.className="meta";connectStatus.textContent="Retrying the first stored inventory snapshot...";
    try{
      const url=new URL(INVENTORY_API+"/api/inventory/retry");url.searchParams.set("user_id",userId);url.searchParams.set("v",Date.now());
      const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},cache:"no-store"});
      const data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.message||"Inventory retry failed");
      connected=true;snapshotReady=!!data.snapshot_ready;snapshotState=String(data.snapshot_state||"ready");hourlyReady=!!data.hourly_ready;
      activeView="totals";applyViewButtons();applyConnectionUi("Inventory snapshot saved. Totals are ready; hourly gains will appear after two scheduled scans.");
      await load(userId);
    }catch(error){
      connected=true;snapshotReady=false;snapshotState="missing";hourlyReady=false;applyConnectionUi(error.message||String(error));
    }
  }
  async function connectSelectedMember(){if(connected&&!snapshotReady){await retryInventoryPull();return}
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
    }catch(error){connectButton.disabled=false;applyConnectionUi(error.message||String(error))}
  }
  async function consumeOAuthResult(){
    const params=new URLSearchParams(location.search),result=params.get("inventory_oauth");if(!result)return false;
    const userId=String(params.get("user_id")||"").trim();
    const connectedResult=result==="connected"||result==="connected_pending";
    if(connectedResult&&userId){
      authorizedUserId=userId;localStorage.setItem(AUTH_USER_STORAGE_KEY,userId);
      connected=true;
      snapshotReady=params.get("snapshot_ready")==="1"||!!params.get("snapshot_at");
      snapshotState=String(params.get("snapshot_state")||(snapshotReady?"ready":"missing"));
      activeView="totals";applyViewButtons();
      try{
        const lookup=new URL(LEAGUE_API+"/api/leagues/player-location");lookup.searchParams.set("user_id",userId);if(config.run)lookup.searchParams.set("run",String(config.run));lookup.searchParams.set("v",Date.now());
        const response=await fetch(lookup,{cache:"no-store"}),data=await response.json();
        if(response.ok&&data.ok!==false&&data.found&&leagueKey(data.league_name)!==leagueKey(config.apiLeague||config.league)){
          const target=new URL("league.html",location.href);target.searchParams.set("league",String(data.league_name));if(config.run)target.searchParams.set("run",String(config.run));
          for(const key of ["inventory_oauth","user_id","inventory_message","snapshot_ready","snapshot_state","snapshot_at","pulled","forced"]){const value=params.get(key);if(value)target.searchParams.set(key,value)}
          location.replace(target.toString());return true;
        }
      }catch(error){console.warn("Could not locate the authorized player's current league",error)}
    }
    connectStatus.className="meta "+(connectedResult?(snapshotReady?"connected":"error"):"error");
    connectStatus.textContent=params.get("inventory_message")||(connectedResult?(snapshotReady?"Inventory access connected and the first snapshot was saved.":"Inventory access connected, but the first snapshot is still missing."):"Inventory authorization failed.");
    history.replaceState({},document.title,oauthReturnUrl());
    return false;
  }
  async function load(userId=memberSelect.value){
    renderHead();
    if(!userId){meta.textContent="No league member selected";tbody.innerHTML=emptyRow("No league members are available.");return}
    const version=++requestVersion,username=selectedName();
    meta.textContent="Loading "+username+"...";
    tbody.innerHTML=emptyRow("Loading inventory data...");
    try{
      const path=activeView==="totals"?"/api/inventory/latest":"/api/inventory/hourly";
      const url=new URL(INVENTORY_API+path);
      url.searchParams.set("user_id",String(userId));
      if(activeView==="totals"){url.searchParams.set("include_items","1");url.searchParams.set("include_damage","1")}
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
      const message=error.message||String(error);
      title.textContent=activeView==="totals"?"Owned Event Pet Totals":"Hourly Pet Gains";
      meta.textContent=username+" · "+message;
      tbody.innerHTML=emptyRow(message);
    }
  }

  function setView(view){
    activeView=view==="totals"?"totals":"hourly";
    applyViewButtons();
    load(memberSelect.value);
  }

  async function handleMemberChange(){
    const userId=selectedUserId();
    connected=false;snapshotReady=false;snapshotState="unknown";hourlyReady=false;
    applyConnectionUi("Checking saved inventory access for "+selectedName()+"...");
    await Promise.all([loadAccessStatus(),load(userId)]);
  }

  async function init(){
    section.hidden=false;
    if(await consumeOAuthResult())return;
    await loadRoster();
    memberSelect.addEventListener("change",handleMemberChange);
    connectButton.addEventListener("click",connectSelectedMember);
    for(const button of viewButtons)button.addEventListener("click",()=>setView(button.dataset.petView));
    applyViewButtons();
    await handleMemberChange();
  }

  init();
})();
