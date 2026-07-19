(function(){
  "use strict";

  const API="https://inventory-detector-worker.opal-dde.workers.dev";
  const LEAGUE_API="https://yamo-league-api-worker.opal-dde.workers.dev";
  const AUTH_USER_STORAGE_KEY="c0ld:inventory-authorized-user";
  const USER={user_id:"463900811",username:"AgentP_0928"};
  const PETS=[
    {key:"elephant",name:"War Elephant"},
    {key:"jaguar",name:"Warrior Jaguar"},
    {key:"peacock",name:"Jewel Peacock"},
    {key:"genie",name:"Genie Fox"}
  ];
  const elements={
    notice:document.getElementById("notice"),
    access:document.getElementById("access-status"),
    optedIn:document.getElementById("opted-in-count"),
    snapshot:document.getElementById("snapshot-time"),
    connect:document.getElementById("connect-button"),
    refresh:document.getElementById("refresh-button"),
    section:document.querySelector(".inventory-total-section"),
    empty:document.getElementById("empty-state"),
    total:document.getElementById("tracked-total")
  };
  let connected=false;

  function showNotice(message,type=""){
    elements.notice.textContent=message;
    elements.notice.className="notice"+(type?" "+type:"");
    elements.notice.hidden=!message;
  }
  function formatCount(value){return Number(value||0).toLocaleString("en-US")}
  function itemName(row){return String(row?.item_id||row?.display_name||"").trim().toLowerCase()}
  function itemCount(row){const value=Number(row?.count??row?.amount??row?.quantity??row?.qty??0);return Number.isFinite(value)&&value>0?Math.floor(value):0}
  function returnUrl(){const url=new URL(location.href);url.search="";url.hash="";return url.toString()}
  async function request(path,options={}){
    const response=await fetch(API+path,{cache:"no-store",...options});
    const text=await response.text();
    let data;try{data=JSON.parse(text)}catch{throw new Error(text.slice(0,220)||`HTTP ${response.status}`)}
    if(!response.ok||data.ok===false){const error=new Error(data.message||`HTTP ${response.status}`);error.status=response.status;throw error}
    return data;
  }
  function renderTotals(data){
    const totals={elephant:0,jaguar:0,peacock:0,genie:0};
    for(const item of data.items||[]){
      const pet=PETS.find(candidate=>candidate.name.toLowerCase()===itemName(item));
      if(pet)totals[pet.key]+=itemCount(item);
    }
    for(const pet of PETS)document.getElementById("pet-"+pet.key).textContent=formatCount(totals[pet.key]);
    elements.total.textContent=formatCount(Object.values(totals).reduce((sum,value)=>sum+value,0));
    const captured=new Date(data.snapshot?.captured_at||0);
    elements.snapshot.textContent=Number.isNaN(captured.getTime())?"Stored snapshot":captured.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    elements.section.classList.add("has-data");
  }
  function resetTotals(message){
    for(const pet of PETS)document.getElementById("pet-"+pet.key).textContent="-";
    elements.total.textContent="-";
    elements.snapshot.textContent="-";
    elements.empty.textContent=message;
    elements.section.classList.remove("has-data");
  }
  async function loadOptedInCount(){
    try{
      const summary=await request(`/api/inventory/oauth/summary?v=${Date.now()}`);
      elements.optedIn.textContent=formatCount(summary.opted_in_players);
      elements.optedIn.title=`${formatCount(summary.opted_in_players)} active saved approval${Number(summary.opted_in_players)===1?"":"s"}`;
    }catch(error){
      elements.optedIn.textContent="Unavailable";
      elements.optedIn.title=error.message||String(error);
    }
  }
  async function load(){
    elements.refresh.disabled=true;
    loadOptedInCount();
    try{
      const status=await request(`/api/inventory/oauth/status?user_id=${encodeURIComponent(USER.user_id)}&v=${Date.now()}`);
      connected=!!status.connected;
      elements.access.textContent=connected?"Connected":"Not connected";
      elements.connect.textContent=connected?"Reconnect and Pull Now":"Connect BIG Games Inventory";
      elements.connect.disabled=false;
      try{
        const latest=await request(`/api/inventory/latest?user_id=${encodeURIComponent(USER.user_id)}&include_items=1&v=${Date.now()}`);
        renderTotals(latest);
      }catch(error){
        if(error.status!==404)throw error;
        resetTotals(connected?"Access is connected, but no inventory snapshot has been stored yet.":"Approve inventory access to create the first snapshot.");
      }
    }catch(error){
      elements.access.textContent="Unavailable";
      elements.connect.disabled=false;
      resetTotals("The inventory service is not ready for this account.");
      showNotice(error.message||String(error),"error");
    }finally{elements.refresh.disabled=false}
  }
  async function connect(){
    elements.connect.disabled=true;
    elements.connect.textContent="Preparing approval...";
    showNotice("Preparing the secure BIG Games approval page...");
    try{
      const params=new URLSearchParams({self:"1",return_url:returnUrl()});
      const data=await request(`/api/inventory/oauth/start?${params}`,{method:"POST",headers:{"content-type":"application/json"}});
      location.assign(data.authorize_url);
    }catch(error){
      elements.connect.disabled=false;
      elements.connect.textContent=connected?"Reconnect and Pull Now":"Connect BIG Games Inventory";
      showNotice(error.message||String(error),"error");
    }
  }
  async function consumeCallback(){
    const params=new URLSearchParams(location.search);
    const result=params.get("inventory_oauth");
    if(!result)return false;
    const message=params.get("inventory_message")||(result==="connected"?"Inventory access was approved and the first snapshot was pulled.":"Inventory authorization failed.");
    const userId=String(params.get("user_id")||"").trim();
    if(result==="connected"&&userId){
      localStorage.setItem(AUTH_USER_STORAGE_KEY,userId);
      try{
        const response=await fetch(`${LEAGUE_API}/api/leagues/player-location?user_id=${encodeURIComponent(userId)}&v=${Date.now()}`,{cache:"no-store"});
        const data=await response.json();
        if(response.ok&&data.ok!==false&&data.found&&data.league_name){
          const target=new URL("league.html",location.href);
          target.searchParams.set("league",String(data.league_name));
          target.searchParams.set("inventory_oauth","connected");
          target.searchParams.set("user_id",userId);
          target.searchParams.set("inventory_message",message);
          location.replace(target.toString());
          return true;
        }
      }catch(error){console.warn("Could not locate the authorized player's current league",error)}
    }
    showNotice(message,result==="connected"?"success":"error");
    history.replaceState({},document.title,location.pathname);
    return false;
  }

  elements.connect.addEventListener("click",connect);
  elements.refresh.addEventListener("click",load);
  (async()=>{if(await consumeCallback())return;load()})();
})();
