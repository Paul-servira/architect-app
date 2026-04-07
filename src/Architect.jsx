import React, { useState, useEffect, useMemo } from "react";
import { S } from "./supabase.js";

const C = {
  bg:"#0A1220",bgCard:"#111B2E",bgSurface:"#0D1628",
  navy:"#0A1F44",gold:"#C9A84C",goldMuted:"#A08732",goldLight:"#E8D59A",
  green:"#34D399",greenDk:"#065F46",yellow:"#FBBF24",yellowDk:"#78350F",
  red:"#F87171",redDk:"#7F1D1D",white:"#F1F0EB",gray:"#8A95A8",
  grayLt:"#C5CDD8",grayDk:"#2A3650",
};
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PILLAR_DEFAULTS=[
  {id:"business",icon:"🚀",label:"Servira",color:"#C9A84C",target:"Side business → $10K/mo by 28"},
  {id:"career",icon:"💼",label:"Career",color:"#60A5FA",target:"Land bilingual AE role, $115K OTE"},
  {id:"finance",icon:"📈",label:"Finances",color:"#34D399",target:"$100K invested by 30"},
  {id:"fitness",icon:"🥊",label:"Fitness",color:"#F87171",target:"Box 3x, lift 2x, sub-15% BF"},
  {id:"relationship",icon:"❤️",label:"Relationship",color:"#F472B6",target:"Weekly date, quarterly trip, present"},
  {id:"growth",icon:"📚",label:"Growth",color:"#A78BFA",target:"2 books/mo, 1 new skill/quarter"},
];
const MILESTONE_DEFAULTS=[
  {id:"m1",label:"First Servira client signed",target:"$800/mo MRR"},
  {id:"m2",label:"Emergency fund complete",target:"$10,000"},
  {id:"m3",label:"AE job offer secured",target:"$115K+ OTE"},
  {id:"m4",label:"TFSA maxed (Year 1)",target:"$7,000"},
  {id:"m5",label:"4 clients on retainer",target:"$3,200/mo MRR"},
  {id:"m6",label:"Body fat under 15%",target:"Measured"},
  {id:"m7",label:"12 books read",target:"6 months"},
  {id:"m8",label:"First quarterly trip taken",target:"With girlfriend"},
];
const QUOTES=[
  "Discipline is choosing between what you want now and what you want most.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "Small daily improvements over time lead to stunning results.",
  "Your future self is watching you right now through memories.",
  "Momentum is a function of consistency, not intensity.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "What you do every day matters more than what you do once in a while.",
  "Don't count the days. Make the days count.",
];

const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const uid=()=>Math.random().toString(36).slice(2,8);

function Ring({pct,color,size=56,stroke=4}){
  const r=(size-stroke)/2,ci=2*Math.PI*r,o=ci-(pct/100)*ci;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.grayDk} strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
      strokeDasharray={ci} strokeDashoffset={o} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.6s ease"}}/>
  </svg>;
}

export default function Architect(){
  const[tab,setTab]=useState("today");
  const[loaded,setLoaded]=useState(false);
  const[pillars,setPillars]=useState(PILLAR_DEFAULTS);
  const[weeklyAnchors,setWeeklyAnchors]=useState({});
  const[dayTasks,setDayTasks]=useState({});
  const[dayNotes,setDayNotes]=useState({});
  const[dayRatings,setDayRatings]=useState({});
  const[milestones,setMilestones]=useState(MILESTONE_DEFAULTS);
  const[milestonesDone,setMilestonesDone]=useState({});
  const[streakDays,setStreakDays]=useState(0);
  const[pillarView,setPillarView]=useState(null);
  const[showAddTask,setShowAddTask]=useState(false);
  const[newTask,setNewTask]=useState({text:"",pillar:"business",time:""});
  const[editAnchors,setEditAnchors]=useState(false);
  const[newAnchor,setNewAnchor]=useState({text:"",days:[]});
  const[showReward,setShowReward]=useState(false);
  const[rewardMsg,setRewardMsg]=useState("");
  const[noteEdit,setNoteEdit]=useState(false);
  const[generated,setGenerated]=useState({});
  const[editMilestones,setEditMilestones]=useState(false);
  const[newMilestone,setNewMilestone]=useState({label:"",target:""});
  const[editingMsId,setEditingMsId]=useState(null);
  const[editMsData,setEditMsData]=useState({label:"",target:""});
  const[editPillars,setEditPillars]=useState(false);
  const[newPillar,setNewPillar]=useState({label:"",icon:"⭐",color:"#60A5FA",target:""});
  const[editingPillarId,setEditingPillarId]=useState(null);
  const[editPillarData,setEditPillarData]=useState({label:"",icon:"",color:"",target:""});
  // Calendar
  const[calMonth,setCalMonth]=useState(()=>new Date().getMonth());
  const[calYear,setCalYear]=useState(()=>new Date().getFullYear());
  const[selectedDay,setSelectedDay]=useState(null);
  const[showCalAdd,setShowCalAdd]=useState(false);
  const[calTaskText,setCalTaskText]=useState("");
  const[calTaskPillar,setCalTaskPillar]=useState("business");
  const[calTaskTime,setCalTaskTime]=useState("");
  // Insights
  const[insightRange,setInsightRange]=useState("30");

  const today=new Date();
  const todayKey=dk(today);
  const dow=today.getDay();
  const quote=QUOTES[today.getDate()%QUOTES.length];
  const todayTaskList=dayTasks[todayKey]||[];

  useEffect(()=>{
    (async()=>{
      const[wa,dt,dn,dr,md,gen,ms,pl]=await Promise.all([
        S.get("arch-weekly-anchors"),S.get("arch-day-tasks"),S.get("arch-day-notes"),
        S.get("arch-day-ratings"),S.get("arch-milestones-done"),S.get("arch-generated"),S.get("arch-milestones"),S.get("arch-pillars"),
      ]);
      if(ms)setMilestones(ms);
      if(pl)setPillars(pl);
      const anchors=wa||{},tasks=dt||{},notes=dn||{},ratings=dr||{},msDone=md||{},genDays=gen||{};
      setWeeklyAnchors(anchors);setDayNotes(notes);setDayRatings(ratings);setMilestonesDone(msDone);setGenerated(genDays);
      const tk=dk(today);
      if(!genDays[tk]&&Object.keys(anchors).length>0){
        const auto=[];
        Object.entries(anchors).forEach(([pid,ancs])=>{ancs.forEach(a=>{if(a.days.includes(today.getDay()))auto.push({id:uid(),text:a.text,pillar:pid,done:false,time:a.time||""})})});
        tasks[tk]=[...(tasks[tk]||[]),...auto];genDays[tk]=true;
        S.set("arch-day-tasks",tasks);S.set("arch-generated",genDays);setGenerated(genDays);
      }
      setDayTasks(tasks);
      let streak=0;const d=new Date(today);d.setDate(d.getDate()-1);
      while(ratings[dk(d)]==="yes"){streak++;d.setDate(d.getDate()-1)}
      setStreakDays(streak);
      setLoaded(true);
    })();
  },[]);

  const reward=(msg)=>{setRewardMsg(msg);setShowReward(true);setTimeout(()=>setShowReward(false),3500)};
  const updateTasks=(t)=>{setDayTasks(t);S.set("arch-day-tasks",t)};

  const toggleTask=(id)=>{
    const tasks=[...(dayTasks[todayKey]||[])];const idx=tasks.findIndex(t=>t.id===id);if(idx===-1)return;
    tasks[idx]={...tasks[idx],done:!tasks[idx].done};const next={...dayTasks,[todayKey]:tasks};updateTasks(next);
    if(tasks[idx].done){const done=tasks.filter(t=>t.done).length;
      if(done===tasks.length&&tasks.length>0)reward("Perfect day. Every anchor hit. 🔥");
      else if(done===Math.ceil(tasks.length*0.75)&&tasks.length>=4)reward("75% done. Strong momentum. ⚡");
    }
  };
  const addTask=()=>{
    if(!newTask.text.trim())return;
    const task={id:uid(),text:newTask.text.trim(),pillar:newTask.pillar,done:false,time:newTask.time};
    updateTasks({...dayTasks,[todayKey]:[...(dayTasks[todayKey]||[]),task]});
    setNewTask({text:"",pillar:"business",time:""});setShowAddTask(false);
  };
  const removeTask=(id)=>updateTasks({...dayTasks,[todayKey]:(dayTasks[todayKey]||[]).filter(t=>t.id!==id)});
  const setRating=(val)=>{
    const next={...dayRatings,[todayKey]:val};setDayRatings(next);S.set("arch-day-ratings",next);
    if(val==="yes"){const ns=streakDays+1;setStreakDays(ns);reward(ns>=7?`${ns}-day streak! Locked in. 🔥`:"Another day done. Consistency compounds. 💪")}
  };
  const saveNote=(text)=>{const next={...dayNotes,[todayKey]:text};setDayNotes(next);S.set("arch-day-notes",next)};
  const addAnchor=(pid)=>{
    if(!newAnchor.text.trim()||newAnchor.days.length===0)return;
    const next={...weeklyAnchors,[pid]:[...(weeklyAnchors[pid]||[]),{id:uid(),text:newAnchor.text.trim(),days:newAnchor.days,time:""}]};
    setWeeklyAnchors(next);S.set("arch-weekly-anchors",next);setNewAnchor({text:"",days:[]});
  };
  const removeAnchor=(pid,aid)=>{const next={...weeklyAnchors,[pid]:(weeklyAnchors[pid]||[]).filter(a=>a.id!==aid)};setWeeklyAnchors(next);S.set("arch-weekly-anchors",next)};
  const toggleMilestone=(id)=>{
    const next={...milestonesDone};if(next[id])delete next[id];else{next[id]=todayKey;reward(`Milestone unlocked: ${milestones.find(m=>m.id===id)?.label} ⭐`)}
    setMilestonesDone(next);S.set("arch-milestones-done",next);
  };

  const doneCount=todayTaskList.filter(t=>t.done).length;
  const totalCount=todayTaskList.length;
  const dayPct=totalCount>0?Math.round((doneCount/totalCount)*100):0;
  const msCount=Object.keys(milestonesDone).length;

  const getPillarPct=(pid)=>{
    const ancs=weeklyAnchors[pid]||[];if(ancs.length===0)return 0;
    let total=0,done=0;ancs.forEach(a=>{total+=a.days.length});
    const sun=new Date(today);sun.setDate(sun.getDate()-sun.getDay());
    for(let i=0;i<7;i++){const d=new Date(sun);d.setDate(d.getDate()+i);(dayTasks[dk(d)]||[]).forEach(t=>{if(t.pillar===pid&&t.done)done++})}
    return total>0?Math.min(100,Math.round((done/total)*100)):0;
  };
  const overallPct=pillars.length>0?Math.round(pillars.reduce((s,p)=>s+getPillarPct(p.id),0)/pillars.length):0;

  // ===== ANALYTICS ENGINE =====
  const analytics=useMemo(()=>{
    const rangeDays=parseInt(insightRange);
    const days=[];
    for(let i=rangeDays-1;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);days.push(dk(d))}

    // Completion rates per day
    const dailyRates=days.map(d=>{
      const tasks=dayTasks[d]||[];if(tasks.length===0)return null;
      return Math.round(tasks.filter(t=>t.done).length/tasks.length*100);
    });
    const activeDays=dailyRates.filter(r=>r!==null);
    const avgCompletion=activeDays.length>0?Math.round(activeDays.reduce((a,b)=>a+b,0)/activeDays.length):0;

    // Momentum score (weighted recent days more)
    let momentum=0;
    if(activeDays.length>0){
      const weights=activeDays.map((_,i)=>1+i*0.5);
      const wSum=weights.reduce((a,b)=>a+b,0);
      momentum=Math.round(activeDays.reduce((s,r,i)=>s+r*weights[i],0)/wSum);
    }

    // Best & worst day of week
    const dowScores=Array(7).fill(null).map(()=>({total:0,count:0}));
    days.forEach(d=>{
      const date=new Date(d+"T12:00:00");const tasks=dayTasks[d]||[];if(tasks.length===0)return;
      const pct=Math.round(tasks.filter(t=>t.done).length/tasks.length*100);
      dowScores[date.getDay()].total+=pct;dowScores[date.getDay()].count++;
    });
    const dowAvg=dowScores.map((s,i)=>({day:DAYS[i],avg:s.count>0?Math.round(s.total/s.count):null}));
    const activeDow=dowAvg.filter(d=>d.avg!==null);
    const bestDay=activeDow.length>0?activeDow.reduce((a,b)=>a.avg>b.avg?a:b):null;
    const worstDay=activeDow.length>0?activeDow.reduce((a,b)=>a.avg<b.avg?a:b):null;

    // Pillar balance
    const pillarScores=pillars.map(p=>{
      let total=0,done=0;
      days.forEach(d=>{(dayTasks[d]||[]).forEach(t=>{if(t.pillar===p.id){total++;if(t.done)done++}})});
      return{...p,pct:total>0?Math.round(done/total*100):0,total,done};
    });
    const strongestPillar=pillarScores.filter(p=>p.total>0).sort((a,b)=>b.pct-a.pct)[0]||null;
    const weakestPillar=pillarScores.filter(p=>p.total>0).sort((a,b)=>a.pct-b.pct)[0]||null;

    // Rating distribution
    const ratings={yes:0,partial:0,no:0,none:0};
    days.forEach(d=>{const r=dayRatings[d];if(r)ratings[r]++;else ratings.none++});

    // Total tasks done
    let totalDone=0,totalAll=0;
    days.forEach(d=>{const tasks=dayTasks[d]||[];totalAll+=tasks.length;totalDone+=tasks.filter(t=>t.done).length});

    // Heatmap data (last 12 weeks = 84 days for display)
    const heatDays=[];
    for(let i=83;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const key=dk(d);
      const tasks=dayTasks[key]||[];const rate=tasks.length>0?tasks.filter(t=>t.done).length/tasks.length:null;
      heatDays.push({key,date:new Date(d),rate,rating:dayRatings[key]||null,dow:d.getDay()});
    }

    return{dailyRates,avgCompletion,momentum,bestDay,worstDay,pillarScores,strongestPillar,weakestPillar,ratings,totalDone,totalAll,heatDays,activeDays:activeDays.length};
  },[dayTasks,dayRatings,pillars,insightRange]);

  // Calendar helpers
  const calDaysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const calFirstDay=new Date(calYear,calMonth,1).getDay();
  const calDays=[];
  for(let i=0;i<calFirstDay;i++)calDays.push(null);
  for(let i=1;i<=calDaysInMonth;i++)calDays.push(i);

  const getCalDayData=(day)=>{
    const d=new Date(calYear,calMonth,day);const key=dk(d);
    const tasks=dayTasks[key]||[];const note=dayNotes[key];const rating=dayRatings[key];
    const done=tasks.filter(t=>t.done).length;
    return{key,tasks,note,rating,done,total:tasks.length};
  };

  const card={background:C.bgCard,borderRadius:16,padding:18,marginBottom:14,border:`1px solid ${C.grayDk}`};
  const inputStyle={width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${C.grayDk}`,background:C.bgSurface,color:C.white,fontSize:14,fontFamily:"inherit",outline:"none"};
  const COLORS_PAL=["#C9A84C","#60A5FA","#34D399","#F87171","#F472B6","#A78BFA","#FB923C","#2DD4BF","#E879F9","#FACC15"];

  const resetNav=()=>{setPillarView(null);setEditAnchors(false);setEditMilestones(false);setEditingMsId(null);setEditPillars(false);setEditingPillarId(null);setSelectedDay(null);setShowCalAdd(false)};

  if(!loaded) return <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontSize:16}}>Loading your blueprint...</div>;

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'DM Sans','Manrope',sans-serif",color:C.white,maxWidth:480,margin:"0 auto",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.3)}50%{box-shadow:0 0 40px rgba(201,168,76,0.6)}}
        *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:0}
        input::placeholder,textarea::placeholder{color:${C.gray}}
      `}</style>

      {showReward&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:999,display:"flex",justifyContent:"center",padding:"20px 16px",animation:"slideIn 0.5s ease"}}>
          <div style={{background:`linear-gradient(135deg,${C.navy},#1a2d5a)`,border:`2px solid ${C.gold}`,borderRadius:16,padding:"20px 24px",maxWidth:380,textAlign:"center",animation:"glow 2s ease infinite",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
            <div style={{fontSize:28,marginBottom:6}}>⚡</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:C.gold,marginBottom:6}}>MOMENTUM</div>
            <div style={{fontSize:13,color:C.grayLt,lineHeight:1.5}}>{rewardMsg}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"22px 18px 14px",background:`linear-gradient(180deg,${C.navy}cc 0%,${C.bg} 100%)`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:12,color:C.gray,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>
              {DAYS[dow]}, {MO[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:C.gold}}>Architect</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {streakDays>0&&<div style={{textAlign:"center"}}><div style={{fontSize:18}}>🔥</div><div style={{fontSize:10,color:C.gold,fontWeight:700}}>{streakDays}d</div></div>}
            <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ring pct={dayPct} color={C.gold} size={50} stroke={4}/>
              <div style={{position:"absolute",fontSize:13,fontWeight:700,color:C.gold}}>{dayPct}%</div>
            </div>
          </div>
        </div>
        <div style={{fontSize:12,color:C.gray,fontStyle:"italic",lineHeight:1.5,borderLeft:`2px solid ${C.goldMuted}`,paddingLeft:10}}>"{quote}"</div>
      </div>

      <div style={{padding:"0 14px 110px",animation:"fadeUp 0.4s ease"}}>

        {/* ===== TODAY ===== */}
        {tab==="today"&&(<div>
          <div style={{...card,marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5}}>Today's Plan — {doneCount}/{totalCount}</div>
              <button onClick={()=>setShowAddTask(!showAddTask)} style={{background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add</button>
            </div>
            {showAddTask&&(
              <div style={{background:C.bgSurface,borderRadius:12,padding:14,marginBottom:14,border:`1px solid ${C.grayDk}`}}>
                <input value={newTask.text} onChange={e=>setNewTask({...newTask,text:e.target.value})} placeholder="What needs to happen today?" style={{...inputStyle,marginBottom:10}} onKeyDown={e=>e.key==="Enter"&&addTask()}/>
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  {pillars.map(p=>(<button key={p.id} onClick={()=>setNewTask({...newTask,pillar:p.id})} style={{padding:"5px 10px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:newTask.pillar===p.id?p.color+"33":"transparent",border:newTask.pillar===p.id?`2px solid ${p.color}`:`1px solid ${C.grayDk}`,color:newTask.pillar===p.id?p.color:C.gray}}>{p.icon} {p.label}</button>))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={newTask.time} onChange={e=>setNewTask({...newTask,time:e.target.value})} placeholder="Time (e.g. 6:30 AM)" style={{...inputStyle,flex:1,fontSize:12}}/>
                  <button onClick={addTask} style={{background:C.gold,color:C.navy,border:"none",borderRadius:10,padding:"10px 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Add</button>
                </div>
              </div>
            )}
            {totalCount===0&&<div style={{textAlign:"center",padding:"24px 0",color:C.gray,fontSize:12}}>No tasks yet. Tap <b>+ Add</b> or set up anchors in <b>Pillars</b>.</div>}
            {todayTaskList.sort((a,b)=>{if(a.time&&b.time)return a.time.localeCompare(b.time);if(a.time)return-1;if(b.time)return 1;return 0}).map(task=>{
              const pillar=pillars.find(p=>p.id===task.pillar);const col=pillar?.color||C.gray;
              return(<div key={task.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:`1px solid ${C.grayDk}22`}}>
                <div onClick={()=>toggleTask(task.id)} style={{width:24,height:24,borderRadius:8,flexShrink:0,cursor:"pointer",border:task.done?"none":`2px solid ${col}44`,background:task.done?col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all 0.2s",color:C.navy,fontWeight:700}}>{task.done&&"✓"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,textDecoration:task.done?"line-through":"none",color:task.done?C.gray:C.white}}>{task.text}</div>
                  <div style={{fontSize:11,color:col,marginTop:2}}>{pillar?.icon} {pillar?.label}{task.time?` · ${task.time}`:""}</div>
                </div>
                <button onClick={()=>removeTask(task.id)} style={{background:"none",border:"none",color:C.grayDk,fontSize:18,cursor:"pointer",padding:4}}>×</button>
              </div>);
            })}
          </div>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5}}>Daily Notes</div>
              <button onClick={()=>setNoteEdit(!noteEdit)} style={{background:"none",border:"none",color:C.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{noteEdit?"Save":"Edit"}</button>
            </div>
            {noteEdit?<textarea value={dayNotes[todayKey]||""} onChange={e=>saveNote(e.target.value)} placeholder="Reflections, ideas, wins, blockers..." style={{...inputStyle,minHeight:100,resize:"vertical",lineHeight:1.6}}/>
            :<div style={{fontSize:13,color:dayNotes[todayKey]?C.grayLt:C.gray,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{dayNotes[todayKey]||"Tap Edit to add notes for today."}</div>}
          </div>
          <div style={card}>
            <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Did today move you forward?</div>
            <div style={{display:"flex",gap:10}}>
              {[{v:"yes",l:"Yes",e:"🟢",c:C.green},{v:"partial",l:"Partially",e:"🟡",c:C.yellow},{v:"no",l:"No",e:"🔴",c:C.red}].map(o=>(
                <button key={o.v} onClick={()=>setRating(o.v)} style={{flex:1,padding:"14px 6px",borderRadius:12,cursor:"pointer",fontFamily:"inherit",background:dayRatings[todayKey]===o.v?o.c+"22":"transparent",border:dayRatings[todayKey]===o.v?`2px solid ${o.c}`:`1px solid ${C.grayDk}`,color:C.white,fontSize:12,fontWeight:600,textAlign:"center",transition:"all 0.2s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{o.e}</div>{o.l}
                </button>
              ))}
            </div>
          </div>
        </div>)}

        {/* ===== CALENDAR ===== */}
        {tab==="calendar"&&!selectedDay&&(
          <div style={{marginTop:14}}>
            <div style={{...card}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(calYear-1)}else setCalMonth(calMonth-1)}} style={{background:"none",border:"none",color:C.gold,fontSize:20,cursor:"pointer",padding:"4px 10px"}}>‹</button>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:C.gold}}>{MONTHS[calMonth]} {calYear}</div>
                <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(calYear+1)}else setCalMonth(calMonth+1)}} style={{background:"none",border:"none",color:C.gold,fontSize:20,cursor:"pointer",padding:"4px 10px"}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
                {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.gray,fontWeight:600,padding:"4px 0"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {calDays.map((day,i)=>{
                  if(!day)return <div key={`e${i}`}/>;
                  const data=getCalDayData(day);
                  const isToday=day===today.getDate()&&calMonth===today.getMonth()&&calYear===today.getFullYear();
                  const isFuture=new Date(calYear,calMonth,day)>today;
                  const rColor=data.rating==="yes"?C.green:data.rating==="partial"?C.yellow:data.rating==="no"?C.red:null;
                  const hasTasks=data.total>0;
                  const completePct=data.total>0?data.done/data.total:0;
                  return(
                    <div key={day} onClick={()=>setSelectedDay(day)} style={{
                      aspectRatio:"1",borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                      cursor:"pointer",position:"relative",
                      background:isToday?C.gold+"22":hasTasks?C.bgSurface:"transparent",
                      border:isToday?`2px solid ${C.gold}`:rColor?`2px solid ${rColor}44`:isFuture&&hasTasks?`1px solid ${C.gold}33`:`1px solid transparent`,
                      opacity:isFuture&&!hasTasks?0.5:1,transition:"all 0.15s",
                    }}>
                      <div style={{fontSize:13,fontWeight:isToday?700:500,color:isToday?C.gold:isFuture?C.grayLt:C.white}}>{day}</div>
                      {hasTasks&&(
                        <div style={{display:"flex",gap:2,marginTop:3}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:isFuture?C.gold:completePct===1?C.green:completePct>0?C.yellow:C.grayDk}}/>
                          {data.note&&<div style={{width:4,height:4,borderRadius:"50%",background:C.gold}}/>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Legend */}
            <div style={{display:"flex",gap:14,justifyContent:"center",padding:"4px 0",marginBottom:8}}>
              {[{c:C.green,l:"Done"},{c:C.yellow,l:"Partial"},{c:C.grayDk,l:"Pending"},{c:C.gold,l:"Note"}].map(x=>(
                <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:x.c}}/><span style={{fontSize:10,color:C.gray}}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Day Detail */}
        {tab==="calendar"&&selectedDay&&(()=>{
          const data=getCalDayData(selectedDay);
          const dateObj=new Date(calYear,calMonth,selectedDay);
          const selKey=dk(dateObj);
          const toggleCalTask=(id)=>{
            const tasks=[...(dayTasks[selKey]||[])];const idx=tasks.findIndex(t=>t.id===id);if(idx===-1)return;
            tasks[idx]={...tasks[idx],done:!tasks[idx].done};updateTasks({...dayTasks,[selKey]:tasks});
          };
          const removeCalTask=(id)=>updateTasks({...dayTasks,[selKey]:(dayTasks[selKey]||[]).filter(t=>t.id!==id)});
          const addCalTask=()=>{
            if(!calTaskText.trim())return;
            const task={id:uid(),text:calTaskText.trim(),pillar:calTaskPillar,done:false,time:calTaskTime};
            updateTasks({...dayTasks,[selKey]:[...(dayTasks[selKey]||[]),task]});
            setCalTaskText("");setCalTaskTime("");setShowCalAdd(false);
          };
          return(
            <div style={{marginTop:14}}>
              <button onClick={()=>setSelectedDay(null)} style={{background:"none",border:"none",color:C.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>← Back to Calendar</button>
              <div style={{...card,borderTop:`3px solid ${C.gold}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <div style={{fontSize:18,fontWeight:700}}>{DAYS[dateObj.getDay()]}, {MO[calMonth]} {selectedDay}</div>
                  <button onClick={()=>setShowCalAdd(!showCalAdd)} style={{background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add</button>
                </div>
                <div style={{fontSize:12,color:C.gray,marginBottom:16}}>
                  {data.total>0?`${data.done}/${data.total} tasks`:"No tasks yet"}
                  {data.rating&&` · Rated: ${data.rating}`}
                </div>

                {/* Add task form */}
                {showCalAdd&&(
                  <div style={{background:C.bgSurface,borderRadius:12,padding:14,marginBottom:14,border:`1px solid ${C.grayDk}`}}>
                    <input value={calTaskText} onChange={e=>setCalTaskText(e.target.value)} placeholder="Plan a task for this day..." style={{...inputStyle,marginBottom:10,fontSize:13}} onKeyDown={e=>e.key==="Enter"&&addCalTask()}/>
                    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                      {pillars.map(p=>(<button key={p.id} onClick={()=>setCalTaskPillar(p.id)} style={{padding:"5px 10px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:calTaskPillar===p.id?p.color+"33":"transparent",border:calTaskPillar===p.id?`2px solid ${p.color}`:`1px solid ${C.grayDk}`,color:calTaskPillar===p.id?p.color:C.gray}}>{p.icon} {p.label}</button>))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <input value={calTaskTime} onChange={e=>setCalTaskTime(e.target.value)} placeholder="Time (e.g. 9:00 AM)" style={{...inputStyle,flex:1,fontSize:12}}/>
                      <button onClick={addCalTask} style={{background:C.gold,color:C.navy,border:"none",borderRadius:10,padding:"10px 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Add</button>
                    </div>
                  </div>
                )}

                {/* Task list */}
                {data.tasks.length>0&&(
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Tasks</div>
                    {data.tasks.sort((a,b)=>{if(a.time&&b.time)return a.time.localeCompare(b.time);if(a.time)return-1;if(b.time)return 1;return 0}).map(t=>{
                      const p=pillars.find(x=>x.id===t.pillar);
                      return(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.grayDk}22`}}>
                        <div onClick={()=>toggleCalTask(t.id)} style={{width:22,height:22,borderRadius:6,background:t.done?(p?.color||C.green):C.grayDk,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.navy,fontWeight:700,flexShrink:0,cursor:"pointer"}}>{t.done&&"✓"}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:500,textDecoration:t.done?"line-through":"none",color:t.done?C.gray:C.white}}>{t.text}</div>
                          <div style={{fontSize:10,color:p?.color||C.gray}}>{p?.icon} {p?.label}{t.time?` · ${t.time}`:""}</div>
                        </div>
                        <button onClick={()=>removeCalTask(t.id)} style={{background:"none",border:"none",color:C.grayDk,fontSize:16,cursor:"pointer",padding:4}}>×</button>
                      </div>);
                    })}
                  </div>
                )}
                {data.note&&(
                  <div>
                    <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Notes</div>
                    <div style={{fontSize:13,color:C.grayLt,lineHeight:1.6,whiteSpace:"pre-wrap",background:C.bgSurface,borderRadius:10,padding:14}}>{data.note}</div>
                  </div>
                )}
                {data.total===0&&!showCalAdd&&!data.note&&<div style={{textAlign:"center",padding:"16px 0",color:C.gray,fontSize:13}}>Nothing planned yet. Tap + Add to plan ahead.</div>}
              </div>
            </div>
          );
        })()}

        {/* ===== PILLARS ===== */}
        {tab==="pillars"&&!pillarView&&(
          <div style={{marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingLeft:4}}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5}}>Your Pillars</div>
              <button onClick={()=>{setEditPillars(!editPillars);setEditingPillarId(null)}} style={{background:"none",border:"none",color:C.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{editPillars?"Done":"Edit"}</button>
            </div>
            {pillars.map(p=>{
              const pct=getPillarPct(p.id);const ac=(weeklyAnchors[p.id]||[]).length;const isEd=editingPillarId===p.id;
              if(isEd)return(
                <div key={p.id} style={{...card,border:`1px solid ${editPillarData.color}44`}}>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input value={editPillarData.icon} onChange={e=>setEditPillarData({...editPillarData,icon:e.target.value})} style={{...inputStyle,width:50,textAlign:"center",fontSize:20,padding:"8px"}} maxLength={2}/>
                    <input value={editPillarData.label} onChange={e=>setEditPillarData({...editPillarData,label:e.target.value})} placeholder="Name" style={{...inputStyle,flex:1,fontSize:13,padding:"8px 10px"}}/>
                  </div>
                  <input value={editPillarData.target} onChange={e=>setEditPillarData({...editPillarData,target:e.target.value})} placeholder="90-day target" style={{...inputStyle,marginBottom:8,fontSize:12,padding:"8px 10px"}}/>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{COLORS_PAL.map(col=>(<div key={col} onClick={()=>setEditPillarData({...editPillarData,color:col})} style={{width:28,height:28,borderRadius:8,background:col,cursor:"pointer",border:editPillarData.color===col?`3px solid ${C.white}`:`3px solid transparent`}}/>))}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{const next=pillars.map(x=>x.id===p.id?{...x,...editPillarData}:x);setPillars(next);S.set("arch-pillars",next);setEditingPillarId(null)}} style={{background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
                    <button onClick={()=>setEditingPillarId(null)} style={{background:"none",border:`1px solid ${C.grayDk}`,color:C.gray,borderRadius:8,padding:"8px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                  </div>
                </div>
              );
              return(
                <div key={p.id} onClick={()=>{if(!editPillars)setPillarView(p.id)}} style={{...card,cursor:editPillars?"default":"pointer",display:"flex",alignItems:"center",gap:14,border:`1px solid ${p.color}22`}}>
                  <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}><Ring pct={pct} color={p.color} size={48} stroke={4}/><div style={{position:"absolute",fontSize:11,fontWeight:700,color:p.color}}>{pct}%</div></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{p.icon} {p.label}</div>
                    <div style={{fontSize:11,color:C.gray}}>{p.target}</div>
                    <div style={{fontSize:10,color:C.grayDk,marginTop:2}}>{ac} anchor{ac!==1?"s":""}</div>
                  </div>
                  {editPillars?(<div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>{setEditingPillarId(p.id);setEditPillarData({label:p.label,icon:p.icon,color:p.color,target:p.target})}} style={{background:C.navy,border:`1px solid ${C.gold}44`,color:C.gold,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                    <button onClick={()=>{const next=pillars.filter(x=>x.id!==p.id);setPillars(next);S.set("arch-pillars",next);const wa={...weeklyAnchors};delete wa[p.id];setWeeklyAnchors(wa);S.set("arch-weekly-anchors",wa)}} style={{background:C.redDk,border:"none",color:C.red,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>×</button>
                  </div>):(<div style={{color:C.grayDk,fontSize:18}}>›</div>)}
                </div>
              );
            })}
            {editPillars&&(
              <div style={{...card,background:C.bgSurface,border:`1px solid ${C.grayDk}`}}>
                <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Add New Pillar</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={newPillar.icon} onChange={e=>setNewPillar({...newPillar,icon:e.target.value})} placeholder="🎯" style={{...inputStyle,width:50,textAlign:"center",fontSize:20,padding:"8px"}} maxLength={2}/>
                  <input value={newPillar.label} onChange={e=>setNewPillar({...newPillar,label:e.target.value})} placeholder="Pillar name" style={{...inputStyle,flex:1,fontSize:13,padding:"8px 10px"}}/>
                </div>
                <input value={newPillar.target} onChange={e=>setNewPillar({...newPillar,target:e.target.value})} placeholder="90-day target" style={{...inputStyle,marginBottom:8,fontSize:12,padding:"8px 10px"}}/>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{COLORS_PAL.map(col=>(<div key={col} onClick={()=>setNewPillar({...newPillar,color:col})} style={{width:28,height:28,borderRadius:8,background:col,cursor:"pointer",border:newPillar.color===col?`3px solid ${C.white}`:`3px solid transparent`}}/>))}</div>
                <button onClick={()=>{if(!newPillar.label.trim())return;const p={id:uid(),label:newPillar.label.trim(),icon:newPillar.icon||"⭐",color:newPillar.color,target:newPillar.target.trim()};const next=[...pillars,p];setPillars(next);S.set("arch-pillars",next);setNewPillar({label:"",icon:"⭐",color:"#60A5FA",target:""})}} style={{width:"100%",padding:"10px",borderRadius:10,background:C.gold,color:C.navy,border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Add Pillar</button>
              </div>
            )}
            <div style={{...card,textAlign:"center",background:`linear-gradient(135deg,${C.navy},${C.bgCard})`,border:`1px solid ${C.gold}33`}}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Overall Weekly Score</div>
              <div style={{position:"relative",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Ring pct={overallPct} color={C.gold} size={90} stroke={5}/><div style={{position:"absolute",fontFamily:"'Playfair Display',serif",fontSize:26,color:C.gold}}>{overallPct}%</div></div>
            </div>
          </div>
        )}

        {/* Pillar Detail */}
        {tab==="pillars"&&pillarView&&(()=>{
          const p=pillars.find(x=>x.id===pillarView);const ancs=weeklyAnchors[pillarView]||[];
          return(<div style={{marginTop:14}}>
            <button onClick={()=>{setPillarView(null);setEditAnchors(false)}} style={{background:"none",border:"none",color:C.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>← Back</button>
            <div style={{...card,borderTop:`3px solid ${p.color}`}}>
              <div style={{fontSize:20,fontWeight:700,marginBottom:3}}>{p.icon} {p.label}</div>
              <div style={{fontSize:12,color:C.gray,marginBottom:16}}>90-day target: {p.target}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5}}>Weekly Anchors</div>
                <button onClick={()=>setEditAnchors(!editAnchors)} style={{background:"none",border:"none",color:C.gold,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{editAnchors?"Done":"Edit"}</button>
              </div>
              {ancs.length===0&&!editAnchors&&<div style={{textAlign:"center",padding:"20px 0",color:C.gray,fontSize:12}}>No anchors yet. Tap Edit to add.</div>}
              {ancs.map(a=>(<div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:`1px solid ${C.grayDk}22`}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{a.text}</div><div style={{fontSize:10,color:C.gray,marginTop:2}}>{a.days.map(d=>DAYS[d]).join(", ")}</div></div>
                {editAnchors&&<button onClick={()=>removeAnchor(pillarView,a.id)} style={{background:C.redDk,border:"none",color:C.red,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Remove</button>}
              </div>))}
              {editAnchors&&(
                <div style={{background:C.bgSurface,borderRadius:12,padding:14,marginTop:14,border:`1px solid ${C.grayDk}`}}>
                  <input value={newAnchor.text} onChange={e=>setNewAnchor({...newAnchor,text:e.target.value})} placeholder="New anchor" style={{...inputStyle,marginBottom:10,fontSize:13}} onKeyDown={e=>e.key==="Enter"&&addAnchor(pillarView)}/>
                  <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>{DAYS.map((d,i)=>(<button key={i} onClick={()=>{const days=newAnchor.days.includes(i)?newAnchor.days.filter(x=>x!==i):[...newAnchor.days,i];setNewAnchor({...newAnchor,days})}} style={{width:38,height:34,borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:newAnchor.days.includes(i)?p.color+"33":"transparent",border:newAnchor.days.includes(i)?`2px solid ${p.color}`:`1px solid ${C.grayDk}`,color:newAnchor.days.includes(i)?p.color:C.gray}}>{d}</button>))}</div>
                  <button onClick={()=>addAnchor(pillarView)} style={{width:"100%",padding:"10px",borderRadius:10,background:p.color,color:C.navy,border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Add Anchor</button>
                </div>
              )}
            </div>
          </div>);
        })()}

        {/* ===== GOALS ===== */}
        {tab==="goals"&&(
          <div style={{marginTop:14}}>
            <div style={{...card,textAlign:"center",background:`linear-gradient(135deg,${C.navy},${C.bgCard})`,border:`1px solid ${C.gold}33`}}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Milestones Unlocked</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,color:C.gold}}>{msCount} <span style={{fontSize:18,color:C.gray}}>/ {milestones.length}</span></div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <button onClick={()=>setEditMilestones(!editMilestones)} style={{background:"none",border:"none",color:C.gold,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{editMilestones?"Done":"Edit Goals"}</button>
            </div>
            {milestones.map((m,idx)=>{
              const done=!!milestonesDone[m.id];const isEd=editingMsId===m.id;
              return(<div key={m.id} style={{...card,display:"flex",alignItems:"center",gap:12,border:done?`1px solid ${C.gold}44`:`1px solid ${C.grayDk}`,background:done?`${C.navy}88`:C.bgCard,cursor:editMilestones?"default":"pointer"}} onClick={()=>{if(!editMilestones)toggleMilestone(m.id)}}>
                <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:done?C.gold:C.grayDk,color:done?C.navy:C.gray,display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?16:13,fontWeight:700}}>{done?"★":idx+1}</div>
                <div style={{flex:1}}>
                  {isEd?(<div onClick={e=>e.stopPropagation()}>
                    <input value={editMsData.label} onChange={e=>setEditMsData({...editMsData,label:e.target.value})} style={{...inputStyle,marginBottom:6,fontSize:13,padding:"8px 10px"}} placeholder="Goal name"/>
                    <input value={editMsData.target} onChange={e=>setEditMsData({...editMsData,target:e.target.value})} style={{...inputStyle,fontSize:12,padding:"8px 10px"}} placeholder="Target"/>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <button onClick={()=>{const next=milestones.map(x=>x.id===m.id?{...x,label:editMsData.label,target:editMsData.target}:x);setMilestones(next);S.set("arch-milestones",next);setEditingMsId(null)}} style={{background:C.gold,color:C.navy,border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
                      <button onClick={()=>setEditingMsId(null)} style={{background:"none",border:`1px solid ${C.grayDk}`,color:C.gray,borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    </div>
                  </div>):(<>
                    <div style={{fontSize:13,fontWeight:600,color:done?C.gold:C.white,marginBottom:2}}>{m.label}</div>
                    <div style={{fontSize:11,color:C.gray}}>{m.target}</div>
                    {done&&<div style={{fontSize:10,color:C.goldMuted,marginTop:2}}>Unlocked {milestonesDone[m.id]}</div>}
                  </>)}
                </div>
                {editMilestones&&!isEd&&(<div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{setEditingMsId(m.id);setEditMsData({label:m.label,target:m.target})}} style={{background:C.navy,border:`1px solid ${C.gold}44`,color:C.gold,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                  <button onClick={()=>{const next=milestones.filter(x=>x.id!==m.id);setMilestones(next);S.set("arch-milestones",next);const nd={...milestonesDone};delete nd[m.id];setMilestonesDone(nd);S.set("arch-milestones-done",nd)}} style={{background:C.redDk,border:"none",color:C.red,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>×</button>
                </div>)}
              </div>);
            })}
            {editMilestones&&(
              <div style={{...card,background:C.bgSurface,border:`1px solid ${C.grayDk}`}}>
                <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Add New Goal</div>
                <input value={newMilestone.label} onChange={e=>setNewMilestone({...newMilestone,label:e.target.value})} placeholder="Goal name" style={{...inputStyle,marginBottom:8,fontSize:13}}/>
                <input value={newMilestone.target} onChange={e=>setNewMilestone({...newMilestone,target:e.target.value})} placeholder="Target" style={{...inputStyle,marginBottom:10,fontSize:12}}/>
                <button onClick={()=>{if(!newMilestone.label.trim())return;const m={id:uid(),label:newMilestone.label.trim(),target:newMilestone.target.trim()};setMilestones([...milestones,m]);S.set("arch-milestones",[...milestones,m]);setNewMilestone({label:"",target:""})}} style={{width:"100%",padding:"10px",borderRadius:10,background:C.gold,color:C.navy,border:"none",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Add Goal</button>
              </div>
            )}
          </div>
        )}

        {/* ===== INSIGHTS (SURPRISE FEATURE) ===== */}
        {tab==="insights"&&(
          <div style={{marginTop:14}}>
            {/* Momentum Score */}
            <div style={{...card,textAlign:"center",background:`linear-gradient(135deg,#0f1a3a,${C.navy})`,border:`1px solid ${C.gold}44`,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:`radial-gradient(circle at 50% 30%,${C.gold}11 0%,transparent 70%)`}}/>
              <div style={{position:"relative"}}>
                <div style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Momentum Score</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:56,color:C.gold,lineHeight:1}}>{analytics.momentum}</div>
                <div style={{fontSize:12,color:C.grayLt,marginTop:6}}>{analytics.momentum>=80?"You're unstoppable right now.":analytics.momentum>=60?"Solid. Keep pushing.":analytics.momentum>=40?"Building. Stay consistent.":analytics.activeDays>0?"Getting started. Show up tomorrow.":"Start tracking to build your score."}</div>
              </div>
            </div>

            {/* Range selector */}
            <div style={{display:"flex",gap:8,marginBottom:14,justifyContent:"center"}}>
              {[{v:"7",l:"7d"},{v:"14",l:"14d"},{v:"30",l:"30d"},{v:"90",l:"90d"}].map(r=>(
                <button key={r.v} onClick={()=>setInsightRange(r.v)} style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:insightRange===r.v?C.gold+"22":"transparent",border:insightRange===r.v?`2px solid ${C.gold}`:`1px solid ${C.grayDk}`,color:insightRange===r.v?C.gold:C.gray}}>{r.l}</button>
              ))}
            </div>

            {/* Stat cards */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div style={card}><div style={{fontSize:28,fontWeight:700,color:C.gold,fontFamily:"'Playfair Display',serif"}}>{analytics.totalDone}</div><div style={{fontSize:10,color:C.gray}}>Tasks completed</div></div>
              <div style={card}><div style={{fontSize:28,fontWeight:700,color:C.green,fontFamily:"'Playfair Display',serif"}}>{analytics.avgCompletion}%</div><div style={{fontSize:10,color:C.gray}}>Avg completion</div></div>
              <div style={card}><div style={{fontSize:28}}>🔥</div><div style={{fontSize:20,fontWeight:700,color:C.gold}}>{streakDays}</div><div style={{fontSize:10,color:C.gray}}>Day streak</div></div>
              <div style={card}><div style={{fontSize:28}}>⭐</div><div style={{fontSize:20,fontWeight:700,color:C.gold}}>{msCount}</div><div style={{fontSize:10,color:C.gray}}>Milestones</div></div>
            </div>

            {/* Heatmap */}
            <div style={card}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Activity — Last 12 Weeks</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:3}}>
                {analytics.heatDays.map((d,i)=>{
                  const intensity=d.rate===null?0:d.rate===0?0.15:d.rate<0.5?0.4:d.rate<1?0.7:1;
                  return <div key={i} style={{aspectRatio:"1",borderRadius:3,background:d.rate===null?C.grayDk+"44":`rgba(201,168,76,${intensity})`,transition:"all 0.2s"}} title={`${d.key}: ${d.rate!==null?Math.round(d.rate*100)+"%":"no data"}`}/>;
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                <span style={{fontSize:9,color:C.grayDk}}>12 weeks ago</span>
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  <span style={{fontSize:9,color:C.gray}}>Less</span>
                  {[0.15,0.4,0.7,1].map((v,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(201,168,76,${v})`}}/>)}
                  <span style={{fontSize:9,color:C.gray}}>More</span>
                </div>
              </div>
            </div>

            {/* Best/Worst day */}
            {analytics.bestDay&&(
              <div style={{display:"flex",gap:12,marginBottom:14}}>
                <div style={{...card,flex:1,textAlign:"center",border:`1px solid ${C.green}33`}}>
                  <div style={{fontSize:22}}>💪</div>
                  <div style={{fontSize:18,fontWeight:700,color:C.green}}>{analytics.bestDay.day}</div>
                  <div style={{fontSize:10,color:C.gray}}>Best day ({analytics.bestDay.avg}%)</div>
                </div>
                <div style={{...card,flex:1,textAlign:"center",border:`1px solid ${C.red}33`}}>
                  <div style={{fontSize:22}}>⚠️</div>
                  <div style={{fontSize:18,fontWeight:700,color:C.red}}>{analytics.worstDay.day}</div>
                  <div style={{fontSize:10,color:C.gray}}>Weakest ({analytics.worstDay.avg}%)</div>
                </div>
              </div>
            )}

            {/* Pillar Balance */}
            <div style={card}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Pillar Balance</div>
              {analytics.pillarScores.map(p=>(
                <div key={p.id} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                    <span style={{fontWeight:500}}>{p.icon} {p.label}</span>
                    <span style={{color:p.color,fontWeight:600}}>{p.pct}%</span>
                  </div>
                  <div style={{height:6,borderRadius:3,background:C.grayDk,overflow:"hidden"}}>
                    <div style={{width:`${Math.max(p.pct,2)}%`,height:"100%",borderRadius:3,background:p.color,transition:"width 0.8s ease"}}/>
                  </div>
                  {p.total>0&&<div style={{fontSize:10,color:C.gray,marginTop:3}}>{p.done}/{p.total} tasks completed</div>}
                </div>
              ))}
              {analytics.strongestPillar&&analytics.weakestPillar&&analytics.strongestPillar.id!==analytics.weakestPillar.id&&(
                <div style={{background:C.bgSurface,borderRadius:10,padding:12,marginTop:8}}>
                  <div style={{fontSize:12,color:C.grayLt,lineHeight:1.6}}>
                    <span style={{color:analytics.strongestPillar.color,fontWeight:600}}>{analytics.strongestPillar.icon} {analytics.strongestPillar.label}</span> is your strongest pillar at {analytics.strongestPillar.pct}%. Consider giving more energy to <span style={{color:analytics.weakestPillar.color,fontWeight:600}}>{analytics.weakestPillar.icon} {analytics.weakestPillar.label}</span> ({analytics.weakestPillar.pct}%) to stay balanced.
                  </div>
                </div>
              )}
            </div>

            {/* Rating distribution */}
            <div style={card}>
              <div style={{fontSize:11,color:C.gray,textTransform:"uppercase",letterSpacing:1.5,marginBottom:14}}>Daily Ratings</div>
              <div style={{display:"flex",gap:12}}>
                {[{l:"Yes",v:analytics.ratings.yes,c:C.green,e:"🟢"},{l:"Partial",v:analytics.ratings.partial,c:C.yellow,e:"🟡"},{l:"No",v:analytics.ratings.no,c:C.red,e:"🔴"}].map(r=>(
                  <div key={r.l} style={{flex:1,textAlign:"center"}}>
                    <div style={{fontSize:16}}>{r.e}</div>
                    <div style={{fontSize:22,fontWeight:700,color:r.c}}>{r.v}</div>
                    <div style={{fontSize:10,color:C.gray}}>{r.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Insight */}
            <div style={{...card,background:`linear-gradient(135deg,#1a1a3e,${C.bgCard})`,border:`1px solid ${C.gold}22`}}>
              <div style={{fontSize:11,color:C.gold,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>🧠 Strategic Insight</div>
              <div style={{fontSize:13,color:C.grayLt,lineHeight:1.7}}>
                {analytics.activeDays===0?"Start logging your days to unlock personalized insights. The system needs data to find your patterns."
                :analytics.momentum>=75?`Your momentum score is ${analytics.momentum}. You're in the top execution zone. The risk now isn't failure — it's burnout. Make sure you're protecting at least one full rest day per week.`
                :analytics.momentum>=50?`Momentum at ${analytics.momentum} — you're building. ${analytics.worstDay?`${analytics.worstDay.day}s are your weak spot (${analytics.worstDay.avg}%). Try pre-loading your easiest anchors on ${analytics.worstDay.day}s to build a completion habit.`:""} ${analytics.weakestPillar?`Your ${analytics.weakestPillar.label} pillar needs attention.`:""}`
                :analytics.momentum>=25?`Momentum is at ${analytics.momentum}. Focus on one thing: completing just your top 2 anchors every day for the next 7 days. Don't try to do everything — consistency on the basics will pull this score up fast.`
                :`Your momentum is low at ${analytics.momentum}, but that's just data, not a verdict. Pick your single most important pillar and commit to one anchor per day. That's it. Build from there.`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav - 5 tabs */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:`${C.bgSurface}ee`,backdropFilter:"blur(20px)",borderTop:`1px solid ${C.grayDk}`,display:"flex",padding:"0 4px",paddingBottom:"env(safe-area-inset-bottom,8px)",zIndex:100}}>
        {[{id:"today",l:"Today",i:"◉"},{id:"calendar",l:"Calendar",i:"▦"},{id:"pillars",l:"Pillars",i:"⬡"},{id:"goals",l:"Goals",i:"★"},{id:"insights",l:"Insights",i:"◈"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);resetNav()}} style={{
            padding:"10px 0",fontSize:9,fontWeight:tab===t.id?700:400,color:tab===t.id?C.gold:C.gray,
            background:"none",border:"none",cursor:"pointer",flex:1,textTransform:"uppercase",letterSpacing:0.8,
            borderTop:tab===t.id?`2px solid ${C.gold}`:"2px solid transparent",fontFamily:"inherit",
          }}>
            <div style={{fontSize:16,marginBottom:2}}>{t.i}</div>{t.l}
          </button>
        ))}
      </div>
    </div>
  );
}
