(function(){
  "use strict";

  const config=window.LEAGUE_CONFIG||{};
  const league=String(config.league||"").trim().toLowerCase();
  if(league!=="dezzz")return;

  const section=document.getElementById("hourly-pet-gains");
  const tbody=document.getElementById("hourly-pet-gains-body");
  const meta=document.getElementById("hourly-pet-gains-meta");
  if(!section||!tbody||!meta)return;

  const API="https://inventory-detector-worker.opal-dde.workers.dev";
  const USER_ID="109818";
  const HOURS=24;
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
  function render(rows){
    const windows=(rows||[]).map(summarize).reverse();
    meta.textContent=windows.length+" completed hour"+(windows.length===1?"":"s")+" · variants combined";
    if(!windows.length){tbody.innerHTML='<tr><td colspan="6" class="empty">No completed inventory hours are available yet.</td></tr>';return}
    tbody.innerHTML=windows.map(row=>'<tr><td>'+esc(hourLabel(row))+'</td>'+PETS.map(pet=>gainCell(row.totals[pet.key])).join("")+gainCell(row.total,true)+'</tr>').join("");
  }
  async function load(){
    section.hidden=false;
    try{
      const url=new URL(API+"/api/inventory/hourly");
      url.searchParams.set("user_id",USER_ID);
      url.searchParams.set("hours",String(HOURS));
      url.searchParams.set("v",Date.now());
      const response=await fetch(url,{cache:"no-store"});
      const data=await response.json();
      if(!response.ok||data.ok===false)throw new Error(data.message||"Inventory request failed");
      render(data.rows||[]);
    }catch(error){
      console.error("Hourly pet gains unavailable",error);
      meta.textContent="Inventory history unavailable";
      tbody.innerHTML='<tr><td colspan="6" class="error">Could not load hourly pet gains.</td></tr>';
    }
  }

  load();
})();
