
import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{initializeApp}from"firebase/app";
import{getFirestore,collection,doc,onSnapshot,setDoc,deleteDoc}from"firebase/firestore";
import{Cloud,LogOut,UserRound,Users,Repeat2,Camera,Trash2}from"lucide-react";
import"./style.css";

const firebaseConfig={
  apiKey:"AIzaSyDPPsTuKKKGerpFOqUL__8OaDpeX57zDHY",
  authDomain:"cromos-mundial-2026.firebaseapp.com",
  projectId:"cromos-mundial-2026",
  storageBucket:"cromos-mundial-2026.firebasestorage.app",
  messagingSenderId:"677146617903",
  appId:"1:677146617903:web:7264b6b2470c808fbffeda",
  measurementId:"G-WL6NESLVHC"
};

const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const albumId="mundial-2026-familia";

const defaultProfiles=[
  {id:"tio-berto",name:"Tio Berto",pin:"menurius33"},
  {id:"sobrinho-rafa",name:"Sobrinho Rafa",pin:"menurius34"},
  {id:"sobrinho-gabe",name:"Sobrinho Gabe",pin:"menurius35"}
];

const starterStickers=[
  {id:"POR-01",country:"Portugal",flag:"🇵🇹",player:"Cristiano Ronaldo",photoUrl:""},
  {id:"POR-02",country:"Portugal",flag:"🇵🇹",player:"Bruno Fernandes",photoUrl:""},
  {id:"POR-03",country:"Portugal",flag:"🇵🇹",player:"Rúben Dias",photoUrl:""},
  {id:"ARG-01",country:"Argentina",flag:"🇦🇷",player:"Lionel Messi",photoUrl:""},
  {id:"ARG-02",country:"Argentina",flag:"🇦🇷",player:"Lautaro Martínez",photoUrl:""},
  {id:"BRA-01",country:"Brasil",flag:"🇧🇷",player:"Vinícius Júnior",photoUrl:""},
  {id:"BRA-02",country:"Brasil",flag:"🇧🇷",player:"Rodrygo",photoUrl:""},
  {id:"ESP-01",country:"Espanha",flag:"🇪🇸",player:"Pedri",photoUrl:""},
  {id:"ESP-02",country:"Espanha",flag:"🇪🇸",player:"Lamine Yamal",photoUrl:""},
  {id:"FRA-01",country:"França",flag:"🇫🇷",player:"Kylian Mbappé",photoUrl:""},
  {id:"ENG-01",country:"Inglaterra",flag:"🏴",player:"Jude Bellingham",photoUrl:""},
  {id:"GER-01",country:"Alemanha",flag:"🇩🇪",player:"Florian Wirtz",photoUrl:""}
];

function initials(text){return(text||"?").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}
function PlayerPhoto({s,mini=false}){if(s.photoUrl)return <img className={mini?"mini-photo":""} src={s.photoUrl} alt={s.player}/>;return <div className={mini?"mini-photo":"photo-placeholder"}>{initials(s.player)}</div>}
function pct(a,b){return b?Math.round(a/b*100):0}

function App(){
  const[profiles,setProfiles]=useState(defaultProfiles);
  const[currentUser,setCurrentUser]=useState(()=>{const s=localStorage.getItem("currentUser");return s?JSON.parse(s):null});
  const[loginProfile,setLoginProfile]=useState(defaultProfiles[0].id);
  const[pin,setPin]=useState("");
  const[stickers,setStickers]=useState(starterStickers);
  const[owned,setOwned]=useState({});
  const[duplicates,setDuplicates]=useState({});
  const[selected,setSelected]=useState(defaultProfiles[0].id);
  const[tab,setTab]=useState("album");
  const[query,setQuery]=useState("");
  const[country,setCountry]=useState("Todas");
  const[syncStatus,setSyncStatus]=useState("A sincronizar...");
  const[newSticker,setNewSticker]=useState({id:"",country:"",flag:"",player:"",photoUrl:""});

  useEffect(()=>{
    const unsubProfiles=onSnapshot(collection(db,"albums",albumId,"profiles"),snap=>{
      const data=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.id.localeCompare(b.id));
      if(data.length)setProfiles(data);
    });
    const unsubStickers=onSnapshot(collection(db,"albums",albumId,"stickers"),snap=>{
      const data=snap.docs.map(d=>d.data()).sort((a,b)=>a.id.localeCompare(b.id));
      if(data.length)setStickers(data);
      setSyncStatus("Sincronizado em tempo real");
    });
    const unsubOwned=onSnapshot(collection(db,"albums",albumId,"owned"),snap=>{
      const next={};snap.docs.forEach(d=>next[d.id]=d.data().stickers||{});setOwned(next);
    });
    const unsubDup=onSnapshot(collection(db,"albums",albumId,"duplicates"),snap=>{
      const next={};snap.docs.forEach(d=>next[d.id]=d.data().stickers||{});setDuplicates(next);
    });
    return()=>{unsubProfiles();unsubStickers();unsubOwned();unsubDup()};
  },[]);

  const countries=useMemo(()=>["Todas",...Array.from(new Set(stickers.map(s=>s.country))).sort()], [stickers]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return stickers.filter(s=>{
      const okCountry=country==="Todas"||s.country===country;
      const okQuery=!q||s.id.toLowerCase().includes(q)||s.player.toLowerCase().includes(q)||s.country.toLowerCase().includes(q);
      return okCountry&&okQuery;
    });
  },[stickers,query,country]);

  const stats=useMemo(()=>profiles.map(p=>{
    const total=stickers.filter(s=>owned[p.id]?.[s.id]).length;
    return{...p,total,missing:stickers.length-total,percent:pct(total,stickers.length)};
  }),[profiles,stickers,owned]);

  const selectedName=profiles.find(p=>p.id===selected)?.name||selected;

  function login(){
    const p=profiles.find(x=>x.id===loginProfile);
    if(!p)return alert("Utilizador não encontrado.");
    if((p.pin||"")!==pin)return alert("PIN errado.");
    const u={id:p.id,name:p.name};
    setCurrentUser(u);setSelected(p.id);localStorage.setItem("currentUser",JSON.stringify(u));
  }
  function logout(){setCurrentUser(null);localStorage.removeItem("currentUser")}

  async function seedInitialAlbum(){
    for(const p of defaultProfiles)await setDoc(doc(db,"albums",albumId,"profiles",p.id),p);
    for(const s of starterStickers)await setDoc(doc(db,"albums",albumId,"stickers",s.id),s);
    alert("Utilizadores e cromos iniciais carregados.");
  }

  async function toggleOwned(userId,stickerId){
    if(!currentUser||currentUser.id!==userId)return alert("Só podes alterar a tua própria coleção.");
    const data={...(owned[userId]||{}),[stickerId]:!owned[userId]?.[stickerId]};
    await setDoc(doc(db,"albums",albumId,"owned",userId),{stickers:data});
  }

  async function changeDuplicate(userId,stickerId,amount){
    if(!currentUser||currentUser.id!==userId)return alert("Só podes alterar os teus repetidos.");
    const val=Math.max(0,(duplicates[userId]?.[stickerId]||0)+amount);
    const data={...(duplicates[userId]||{}),[stickerId]:val};
    await setDoc(doc(db,"albums",albumId,"duplicates",userId),{stickers:data});
  }

  async function addSticker(){
    const id=newSticker.id.trim().toUpperCase();
    const player=newSticker.player.trim();
    const c=newSticker.country.trim();
    if(!id||!player||!c)return alert("Preenche código, jogador e seleção.");
    if(stickers.some(s=>s.id===id))return alert("Esse código já existe.");
    const sticker={id,player,country:c,flag:newSticker.flag.trim()||"🏳️",photoUrl:newSticker.photoUrl.trim()};
    await setDoc(doc(db,"albums",albumId,"stickers",id),sticker);
    setNewSticker({id:"",country:"",flag:"",player:"",photoUrl:""});
  }

  async function updatePhoto(sticker){
    const url=prompt("Cola o link da foto do jogador:",sticker.photoUrl||"");
    if(url===null)return;
    await setDoc(doc(db,"albums",albumId,"stickers",sticker.id),{...sticker,photoUrl:url.trim()});
  }

  async function removeSticker(id){
    if(!confirm("Queres apagar este cromo?"))return;
    await deleteDoc(doc(db,"albums",albumId,"stickers",id));
  }

  async function saveProfile(profile){
    await setDoc(doc(db,"albums",albumId,"profiles",profile.id),profile);
    if(currentUser?.id===profile.id){
      const u={id:profile.id,name:profile.name};
      setCurrentUser(u);localStorage.setItem("currentUser",JSON.stringify(u));
    }
  }

  const missing=stickers.filter(s=>!owned[selected]?.[s.id]);
  const trades=useMemo(()=>{
    const out=[];
    for(const receiver of profiles)for(const giver of profiles)if(receiver.id!==giver.id)
      for(const s of stickers)if(!owned[receiver.id]?.[s.id]&&(duplicates[giver.id]?.[s.id]||0)>0)out.push({receiver,giver,sticker:s});
    return out;
  },[profiles,stickers,owned,duplicates]);

  if(!currentUser)return <div className="login-wrap"><div className="login">
    <h1>Álbum Mundial 2026</h1>
    <p>Entra com o teu utilizador para gerir a tua coleção.</p>
    <div className="login-grid">{profiles.map(p=><button key={p.id} className={"user-btn "+(loginProfile===p.id?"active":"")} onClick={()=>setLoginProfile(p.id)}><UserRound size={17}/>{p.name}</button>)}</div>
    <input type="password" placeholder="Código de entrada" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/>
    <p><button className="primary" onClick={login}>Entrar</button></p>
    <p style={{fontSize:13}}>Entradas: Tio Berto / menurius33 · Rafa / menurius34 · Gabe / menurius35</p>
  </div></div>;

  return <div className="app">
    <div className="hero">
      <div><h1>Álbum Mundial 2026</h1><p>App familiar estilo álbum: cromos, fotos, seleções, faltas e trocas.</p></div>
      <div className="badges">
        <div className="badge"><Users size={16}/> {currentUser.name}</div>
        <div className="badge"><Cloud size={16}/> {syncStatus}</div>
        <button className="secondary" onClick={logout}><LogOut size={15}/> Sair</button>
      </div>
    </div>

    <div className="stats">{stats.map(s=><div className="stat" key={s.id}>
      <h2>{s.name}<span>{s.percent}%</span></h2>
      <div className="progress"><div className="bar" style={{width:`${s.percent}%`}}/></div>
      <p>Tem <b>{s.total}</b> de <b>{stickers.length}</b>. Faltam <b>{s.missing}</b>.</p>
    </div>)}</div>

    <div className="tabs">
      <button className={tab==="album"?"active":""} onClick={()=>setTab("album")}>Álbum</button>
      <button className={tab==="faltas"?"active":""} onClick={()=>setTab("faltas")}>Faltas</button>
      <button className={tab==="trocas"?"active":""} onClick={()=>setTab("trocas")}>Trocas</button>
      <button className={tab==="adicionar"?"active":""} onClick={()=>setTab("adicionar")}>Adicionar cromos</button>
      <button className={tab==="perfis"?"active":""} onClick={()=>setTab("perfis")}>Perfis</button>
    </div>

    {tab==="album"&&<div className="panel">
      <div className="controls">
        <select value={selected} onChange={e=>setSelected(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={country} onChange={e=>setCountry(e.target.value)}>{countries.map(c=><option key={c}>{c}</option>)}</select>
        <input placeholder="Pesquisar jogador, seleção ou código" value={query} onChange={e=>setQuery(e.target.value)}/>
      </div>
      <div className="album-grid">{filtered.map(s=>{
        const has=!!owned[selected]?.[s.id]; const reps=duplicates[selected]?.[s.id]||0;
        return <div className="sticker-card" key={s.id}>
          <div className="sticker-top">
            <span className="flag">{s.flag||"🏳️"}</span><span className="code">{s.id}</span><PlayerPhoto s={s}/>
          </div>
          <div className="sticker-body">
            <h3>{s.player}</h3><p>{s.country}</p>
            <div className="card-actions">
              <button className={has?"owned":"not-owned"} onClick={()=>toggleOwned(selected,s.id)}>{has?"Tenho":"Falta"}</button>
              <button className="secondary" onClick={()=>updatePhoto(s)}><Camera size={14}/> Foto</button>
            </div>
            <div className="dup-row"><span>Repetidos</span><button onClick={()=>changeDuplicate(selected,s.id,-1)}>-</button><b>{reps}</b><button onClick={()=>changeDuplicate(selected,s.id,1)}>+</button></div>
          </div>
        </div>
      })}</div>
    </div>}

    {tab==="faltas"&&<div className="panel">
      <div className="controls"><select value={selected} onChange={e=>setSelected(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <h2>Faltam a {selectedName}: {missing.length}</h2>
      <div className="album-grid">{missing.map(s=><div className="sticker-card" key={s.id}><div className="sticker-top"><span className="flag">{s.flag||"🏳️"}</span><span className="code">{s.id}</span><PlayerPhoto s={s}/></div><div className="sticker-body"><h3>{s.player}</h3><p>{s.country}</p></div></div>)}</div>
    </div>}

    {tab==="trocas"&&<div className="panel"><h2><Repeat2 size={21}/> Sugestões de troca</h2>
      {trades.length===0?<p>Ainda não há trocas possíveis. Marca repetidos para aparecerem sugestões.</p>:<div className="trade-list">{trades.map((t,i)=><div className="trade" key={i}><PlayerPhoto s={t.sticker} mini/><div><b>{t.giver.name} pode dar a {t.receiver.name}</b><p>{t.sticker.flag} {t.sticker.id} · {t.sticker.player} · {t.sticker.country}</p></div></div>)}</div>}
    </div>}

    {tab==="adicionar"&&<div className="panel"><h2>Adicionar cromo ao álbum</h2>
      <div className="form-grid">
        <input placeholder="Código: POR-04" value={newSticker.id} onChange={e=>setNewSticker({...newSticker,id:e.target.value})}/>
        <input placeholder="Seleção" value={newSticker.country} onChange={e=>setNewSticker({...newSticker,country:e.target.value})}/>
        <input placeholder="Bandeira: 🇵🇹" value={newSticker.flag} onChange={e=>setNewSticker({...newSticker,flag:e.target.value})}/>
        <input placeholder="Jogador" value={newSticker.player} onChange={e=>setNewSticker({...newSticker,player:e.target.value})}/>
        <input placeholder="Link da foto" value={newSticker.photoUrl} onChange={e=>setNewSticker({...newSticker,photoUrl:e.target.value})}/>
        <button className="primary" onClick={addSticker}>Adicionar</button>
      </div>
      <p><button className="secondary" onClick={seedInitialAlbum}>Carregar utilizadores e cromos iniciais</button></p>
      <div className="small-list">{stickers.map(s=><div className="small-item" key={s.id}><span>{s.flag} {s.id} · {s.player}</span><button className="danger" onClick={()=>removeSticker(s.id)}><Trash2 size={15}/></button></div>)}</div>
    </div>}

    {tab==="perfis"&&<div className="panel"><h2>Perfis</h2><p>Usa só primeiro nome ou alcunha.</p><div className="profile-grid">{profiles.map(p=><ProfileEditor key={p.id} profile={p} onSave={saveProfile}/>)}</div></div>}
  </div>
}

function ProfileEditor({profile,onSave}){
  const[name,setName]=useState(profile.name);
  const[pin,setPin]=useState(profile.pin||"");
  useEffect(()=>{setName(profile.name);setPin(profile.pin||"")},[profile]);
  return <div className="profile-card">
    <h3>{profile.name}</h3>
    <p>Nome</p><input value={name} onChange={e=>setName(e.target.value)}/>
    <p>Código de entrada</p><input value={pin} onChange={e=>setPin(e.target.value)}/>
    <p><button className="primary" onClick={()=>onSave({...profile,name:name.trim()||profile.name,pin:pin.trim()})}>Guardar</button></p>
  </div>
}

createRoot(document.getElementById("root")).render(<App/>);
