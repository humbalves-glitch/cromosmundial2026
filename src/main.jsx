
import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{initializeApp}from"firebase/app";
import{getFirestore,collection,doc,onSnapshot,setDoc}from"firebase/firestore";
import{Cloud,LogOut,Search,UserRound,Users,Repeat2,PackageOpen}from"lucide-react";
import stickersData from"./data/stickers.json";
import teamsData from"./data/teams.json";
import"./style.css";

const firebaseConfig={apiKey:"AIzaSyDPPsTuKKKGerpFOqUL__8OaDpeX57zDHY",authDomain:"cromos-mundial-2026.firebaseapp.com",projectId:"cromos-mundial-2026",storageBucket:"cromos-mundial-2026.firebasestorage.app",messagingSenderId:"677146617903",appId:"1:677146617903:web:7264b6b2470c808fbffeda",measurementId:"G-WL6NESLVHC"};
const app=initializeApp(firebaseConfig),db=getFirestore(app),albumId="panini-classica-2026";
const users=[{id:"tio-berto",name:"Tio Berto",pin:"menurius33"},{id:"rafa",name:"Sobrinho Rafa",pin:"menurius34"},{id:"gabe",name:"Sobrinho Gabe",pin:"menurius35"}];

function initials(n){return(n||"?").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function StickerImage({s}){const[fail,setFail]=useState(false);if(!s.photo||fail)return <div className={"fallback "+s.type}><span>{s.type==="especial"?"★":initials(s.name)}</span></div>;return <img src={s.photo} alt={s.name} onError={()=>setFail(true)}/>}

function App(){
 const[logged,setLogged]=useState(()=>{const s=localStorage.getItem("paniniUser");return s?JSON.parse(s):null});
 const[loginUser,setLoginUser]=useState(users[0].id),[pin,setPin]=useState("");
 const[viewUser,setViewUser]=useState(users[0].id),[stickers,setStickers]=useState(stickersData),[owned,setOwned]=useState({}),[dups,setDups]=useState({});
 const[tab,setTab]=useState("album"),[team,setTeam]=useState("Todas"),[query,setQuery]=useState(""),[sync,setSync]=useState("A sincronizar...");
 useEffect(()=>{const a=onSnapshot(collection(db,"albums",albumId,"stickers"),snap=>{const d=snap.docs.map(x=>x.data()).sort((a,b)=>a.id.localeCompare(b.id));if(d.length)setStickers(d);setSync("Sincronizado online")});const b=onSnapshot(collection(db,"albums",albumId,"owned"),snap=>{const n={};snap.docs.forEach(d=>n[d.id]=d.data().stickers||{});setOwned(n)});const c=onSnapshot(collection(db,"albums",albumId,"dups"),snap=>{const n={};snap.docs.forEach(d=>n[d.id]=d.data().stickers||{});setDups(n)});return()=>{a();b();c()}},[]);
 useEffect(()=>{if(logged)setViewUser(logged.id)},[logged]);
 const teams=useMemo(()=>[{code:"Todas",name:"Todas",flag:"🌍"},...teamsData,{code:"SPECIAL",name:"Especiais",flag:"⭐"}],[]);
 const visible=useMemo(()=>{const q=query.trim().toLowerCase();return stickers.filter(s=>(team==="Todas"||s.teamCode===team)&&(!q||s.id.toLowerCase().includes(q)||s.name.toLowerCase().includes(q)||s.country.toLowerCase().includes(q))&&(tab!=="faltas"||!owned[viewUser]?.[s.id]))},[stickers,team,query,tab,owned,viewUser]);
 const stats=users.map(u=>{const total=stickers.filter(s=>owned[u.id]?.[s.id]).length;return{...u,total,missing:stickers.length-total,percent:stickers.length?Math.round(total/stickers.length*100):0}});
 const teamProgress=teams.filter(t=>t.code!=="Todas").map(t=>{const list=stickers.filter(s=>s.teamCode===t.code);const have=list.filter(s=>owned[viewUser]?.[s.id]).length;return{...t,total:list.length,have,percent:list.length?Math.round(have/list.length*100):0}});
 const trades=useMemo(()=>{const out=[];for(const r of users)for(const g of users)if(r.id!==g.id)for(const s of stickers)if(!owned[r.id]?.[s.id]&&(dups[g.id]?.[s.id]||0)>0)out.push({receiver:r,giver:g,sticker:s});return out},[stickers,owned,dups]);
 function login(){const u=users.find(x=>x.id===loginUser&&x.pin===pin);if(!u)return alert("Código errado.");const safe={id:u.id,name:u.name};setLogged(safe);localStorage.setItem("paniniUser",JSON.stringify(safe))}
 function logout(){setLogged(null);localStorage.removeItem("paniniUser")}
 async function seed(){for(const s of stickersData)await setDoc(doc(db,"albums",albumId,"stickers",s.id),s);alert("Estrutura carregada: 48 seleções + especiais.")}
 async function toggle(id){if(!logged||logged.id!==viewUser)return alert("Só podes alterar a tua própria coleção.");const next={...(owned[logged.id]||{}),[id]:!owned[logged.id]?.[id]};await setDoc(doc(db,"albums",albumId,"owned",logged.id),{stickers:next})}
 async function dup(id,delta){if(!logged||logged.id!==viewUser)return alert("Só podes alterar os teus repetidos.");const val=Math.max(0,(dups[logged.id]?.[id]||0)+delta);const next={...(dups[logged.id]||{}),[id]:val};await setDoc(doc(db,"albums",albumId,"dups",logged.id),{stickers:next})}
 async function photo(s){const url=prompt("Cola o link da imagem/foto:",s.photo||"");if(url===null)return;await setDoc(doc(db,"albums",albumId,"stickers",s.id),{...s,photo:url.trim()})}
 if(!logged)return <div className="loginPage"><div className="loginBox"><h1>Panini Mundial 2026</h1><p>App de apoio à vossa caderneta clássica.</p><div className="loginUsers">{users.map(u=><button key={u.id} className={loginUser===u.id?"active":""} onClick={()=>setLoginUser(u.id)}><UserRound size={16}/>{u.name}</button>)}</div><input type="password" placeholder="Código" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/><button className="primary" onClick={login}>Entrar</button></div></div>;
 return <div className="app"><header className="hero"><div><h1>Panini Mundial 2026</h1><p>Checklist familiar: tenho, falta, repetidos e trocas.</p></div><div className="badges"><span><Users size={16}/>{logged.name}</span><span><Cloud size={16}/>{sync}</span><button onClick={logout}><LogOut size={15}/>Sair</button></div></header>
 <section className="stats">{stats.map(s=><div className="stat" key={s.id}><h2>{s.name}<b>{s.percent}%</b></h2><div className="progress"><div style={{width:`${s.percent}%`}}/></div><p>{s.total}/{stickers.length} cromos</p></div>)}</section>
 <nav className="tabs"><button className={tab==="album"?"active":""} onClick={()=>setTab("album")}>Álbum</button><button className={tab==="faltas"?"active":""} onClick={()=>setTab("faltas")}>Faltas</button><button className={tab==="selecoes"?"active":""} onClick={()=>setTab("selecoes")}>Seleções</button><button className={tab==="trocas"?"active":""} onClick={()=>setTab("trocas")}>Trocas</button><button className={tab==="config"?"active":""} onClick={()=>setTab("config")}>Config</button></nav>
 {(tab==="album"||tab==="faltas")&&<><section className="controls"><select value={viewUser} onChange={e=>setViewUser(e.target.value)}>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select><select value={team} onChange={e=>setTeam(e.target.value)}>{teams.map(t=><option key={t.code} value={t.code}>{t.flag} {t.name}</option>)}</select><div className="search"><Search size={16}/><input placeholder="Pesquisar código, jogador, seleção..." value={query} onChange={e=>setQuery(e.target.value)}/></div></section><section className="grid">{visible.map(s=>{const has=!!owned[viewUser]?.[s.id];const reps=dups[viewUser]?.[s.id]||0;return <article className="card" key={s.id}><div className="photo"><span className="flag">{s.flag}</span><span className="code">{s.id}</span><StickerImage s={s}/></div><div className="body"><h3>{s.name}</h3><p>{s.country} · {s.type}</p><button className={has?"have":"missing"} onClick={()=>toggle(s.id)}>{has?"Tenho":"Falta"}</button><button className="photoBtn" onClick={()=>photo(s)}>Foto</button><div className="dup"><span>Repetidos</span><button onClick={()=>dup(s.id,-1)}>-</button><b>{reps}</b><button onClick={()=>dup(s.id,1)}>+</button></div></div></article>})}</section></>}
 {tab==="selecoes"&&<section className="teamGrid">{teamProgress.map(t=><button key={t.code} onClick={()=>{setTeam(t.code);setTab("album")}}><span>{t.flag}</span><b>{t.name}</b><small>{t.have}/{t.total} · {t.percent}%</small><div className="miniProgress"><div style={{width:`${t.percent}%`}}/></div></button>)}</section>}
 {tab==="trocas"&&<section className="panel"><h2><Repeat2 size={20}/> Sugestões de troca</h2>{trades.length===0?<p>Ainda não há trocas possíveis.</p>:<div className="tradeGrid">{trades.map((t,i)=><div className="trade" key={i}><b>{t.giver.name}</b> pode dar <b>{t.sticker.id}</b> a <b>{t.receiver.name}</b><span>{t.sticker.flag} {t.sticker.name} · {t.sticker.country}</span></div>)}</div>}</section>}
 {tab==="config"&&<section className="panel"><h2>Configuração</h2><p>Carrega a estrutura base da caderneta clássica na Firebase.</p><button className="primary" onClick={seed}><PackageOpen size={16}/> Carregar estrutura Panini</button></section>}</div>
}
createRoot(document.getElementById("root")).render(<App/>);
