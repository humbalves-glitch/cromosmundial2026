
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { Cloud, LogOut, Repeat2, Search, UserRound, Users } from "lucide-react";
import "./style.css";

const firebaseConfig = {
  apiKey: "AIzaSyDPPsTuKKKGerpFOqUL__8OaDpeX57zDHY",
  authDomain: "cromos-mundial-2026.firebaseapp.com",
  projectId: "cromos-mundial-2026",
  storageBucket: "cromos-mundial-2026.firebasestorage.app",
  messagingSenderId: "677146617903",
  appId: "1:677146617903:web:7264b6b2470c808fbffeda",
  measurementId: "G-WL6NESLVHC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const albumId = "album-familiar-final";

const users = [
  { id: "tio-berto", name: "Tio Berto", pin: "menurius33" },
  { id: "rafa", name: "Sobrinho Rafa", pin: "menurius34" },
  { id: "gabe", name: "Sobrinho Gabe", pin: "menurius35" },
];

const starterPlayers = [
  { id: "POR01", player: "Cristiano Ronaldo", country: "Portugal", flag: "🇵🇹", photo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg" },
  { id: "POR02", player: "Bruno Fernandes", country: "Portugal", flag: "🇵🇹", photo: "" },
  { id: "POR03", player: "Rúben Dias", country: "Portugal", flag: "🇵🇹", photo: "" },
  { id: "ARG01", player: "Lionel Messi", country: "Argentina", flag: "🇦🇷", photo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg" },
  { id: "ARG02", player: "Lautaro Martínez", country: "Argentina", flag: "🇦🇷", photo: "" },
  { id: "BRA01", player: "Vinicius Junior", country: "Brasil", flag: "🇧🇷", photo: "" },
  { id: "BRA02", player: "Rodrygo", country: "Brasil", flag: "🇧🇷", photo: "" },
  { id: "ESP01", player: "Pedri", country: "Espanha", flag: "🇪🇸", photo: "" },
  { id: "ESP02", player: "Lamine Yamal", country: "Espanha", flag: "🇪🇸", photo: "" },
  { id: "FRA01", player: "Kylian Mbappé", country: "França", flag: "🇫🇷", photo: "" },
  { id: "ENG01", player: "Jude Bellingham", country: "Inglaterra", flag: "🏴", photo: "" },
  { id: "GER01", player: "Florian Wirtz", country: "Alemanha", flag: "🇩🇪", photo: "" },
];

function initials(name) {
  return name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
}

function PlayerImage({ player }) {
  const [failed, setFailed] = useState(false);
  if (!player.photo || failed) {
    return <div className="photoFallback"><span>{initials(player.player)}</span></div>;
  }
  return <img src={player.photo} alt={player.player} onError={() => setFailed(true)} />;
}

function App() {
  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem("albumUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedLogin, setSelectedLogin] = useState(users[0].id);
  const [pin, setPin] = useState("");
  const [players, setPlayers] = useState(starterPlayers);
  const [owned, setOwned] = useState({});
  const [duplicates, setDuplicates] = useState({});
  const [viewUser, setViewUser] = useState(users[0].id);
  const [tab, setTab] = useState("album");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("Todas");
  const [sync, setSync] = useState("A sincronizar...");
  const [newPlayer, setNewPlayer] = useState({ id: "", player: "", country: "", flag: "", photo: "" });

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "albums", albumId, "players"), (snap) => {
      const data = snap.docs.map(d => d.data()).sort((a, b) => a.id.localeCompare(b.id));
      if (data.length > 0) setPlayers(data);
      setSync("Sincronizado online");
    });
    const unsubOwned = onSnapshot(collection(db, "albums", albumId, "owned"), (snap) => {
      const next = {};
      snap.docs.forEach(d => next[d.id] = d.data().stickers || {});
      setOwned(next);
    });
    const unsubDuplicates = onSnapshot(collection(db, "albums", albumId, "duplicates"), (snap) => {
      const next = {};
      snap.docs.forEach(d => next[d.id] = d.data().stickers || {});
      setDuplicates(next);
    });
    return () => { unsubPlayers(); unsubOwned(); unsubDuplicates(); };
  }, []);

  useEffect(() => { if (loggedUser) setViewUser(loggedUser.id); }, [loggedUser]);

  const countries = useMemo(() => ["Todas", ...Array.from(new Set(players.map(p => p.country))).sort()], [players]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter(p => {
      const matchCountry = country === "Todas" || p.country === country;
      const matchSearch = !q || p.player.toLowerCase().includes(q) || p.country.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      if (tab === "faltas") return matchCountry && matchSearch && !owned[viewUser]?.[p.id];
      return matchCountry && matchSearch;
    });
  }, [players, country, search, tab, owned, viewUser]);

  const stats = users.map(u => {
    const total = players.filter(p => owned[u.id]?.[p.id]).length;
    const percent = players.length ? Math.round((total / players.length) * 100) : 0;
    return { ...u, total, missing: players.length - total, percent };
  });

  const trades = useMemo(() => {
    const result = [];
    for (const receiver of users) {
      for (const giver of users) {
        if (receiver.id === giver.id) continue;
        for (const p of players) {
          if (!owned[receiver.id]?.[p.id] && (duplicates[giver.id]?.[p.id] || 0) > 0) {
            result.push({ receiver, giver, player: p });
          }
        }
      }
    }
    return result;
  }, [players, owned, duplicates]);

  function login() {
    const u = users.find(x => x.id === selectedLogin && x.pin === pin);
    if (!u) return alert("Código errado.");
    const safeUser = { id: u.id, name: u.name };
    setLoggedUser(safeUser);
    localStorage.setItem("albumUser", JSON.stringify(safeUser));
  }

  function logout() {
    setLoggedUser(null);
    localStorage.removeItem("albumUser");
  }

  async function seedAlbum() {
    for (const p of starterPlayers) {
      await setDoc(doc(db, "albums", albumId, "players", p.id), p);
    }
    alert("Lista inicial carregada.");
  }

  async function toggleOwned(playerId) {
    if (!loggedUser || loggedUser.id !== viewUser) return alert("Só podes alterar a tua própria coleção.");
    const next = { ...(owned[loggedUser.id] || {}), [playerId]: !owned[loggedUser.id]?.[playerId] };
    await setDoc(doc(db, "albums", albumId, "owned", loggedUser.id), { stickers: next });
  }

  async function changeDuplicate(playerId, amount) {
    if (!loggedUser || loggedUser.id !== viewUser) return alert("Só podes alterar os teus repetidos.");
    const current = duplicates[loggedUser.id]?.[playerId] || 0;
    const nextAmount = Math.max(0, current + amount);
    const next = { ...(duplicates[loggedUser.id] || {}), [playerId]: nextAmount };
    await setDoc(doc(db, "albums", albumId, "duplicates", loggedUser.id), { stickers: next });
  }

  async function updatePhoto(player) {
    const url = prompt("Cola aqui o link da foto:", player.photo || "");
    if (url === null) return;
    await setDoc(doc(db, "albums", albumId, "players", player.id), { ...player, photo: url.trim() });
  }

  async function addPlayer() {
    const id = newPlayer.id.trim().toUpperCase();
    if (!id || !newPlayer.player.trim() || !newPlayer.country.trim()) return alert("Preenche código, jogador e seleção.");
    const p = { id, player: newPlayer.player.trim(), country: newPlayer.country.trim(), flag: newPlayer.flag.trim() || "🏳️", photo: newPlayer.photo.trim() };
    await setDoc(doc(db, "albums", albumId, "players", id), p);
    setNewPlayer({ id: "", player: "", country: "", flag: "", photo: "" });
  }

  if (!loggedUser) {
    return (
      <div className="loginPage">
        <div className="loginBox">
          <h1>Álbum Mundial 2026</h1>
          <p>Escolhe o teu utilizador e entra com o código.</p>
          <div className="loginButtons">
            {users.map(u => (
              <button key={u.id} className={selectedLogin === u.id ? "active" : ""} onClick={() => setSelectedLogin(u.id)}>
                <UserRound size={16} /> {u.name}
              </button>
            ))}
          </div>
          <input type="password" placeholder="Código" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
          <button className="primary" onClick={login}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <div><h1>🌍 Álbum Mundial 2026</h1><p>App familiar para cromos, faltas, repetidos e trocas.</p></div>
        <div className="topBadges">
          <span><Users size={16} /> {loggedUser.name}</span>
          <span><Cloud size={16} /> {sync}</span>
          <button onClick={logout}><LogOut size={15} /> Sair</button>
        </div>
      </header>

      <section className="statsGrid">
        {stats.map(s => (
          <div className="stat" key={s.id}>
            <h2>{s.name}<b>{s.percent}%</b></h2>
            <div className="progress"><div style={{ width: `${s.percent}%` }} /></div>
            <p>Tem {s.total} de {players.length}. Faltam {s.missing}.</p>
          </div>
        ))}
      </section>

      <nav className="tabs">
        <button className={tab === "album" ? "active" : ""} onClick={() => setTab("album")}>Álbum</button>
        <button className={tab === "faltas" ? "active" : ""} onClick={() => setTab("faltas")}>Faltas</button>
        <button className={tab === "trocas" ? "active" : ""} onClick={() => setTab("trocas")}>Trocas</button>
        <button className={tab === "adicionar" ? "active" : ""} onClick={() => setTab("adicionar")}>Adicionar</button>
      </nav>

      {tab !== "trocas" && tab !== "adicionar" && (
        <section className="controls">
          <select value={viewUser} onChange={e => setViewUser(e.target.value)}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select value={country} onChange={e => setCountry(e.target.value)}>{countries.map(c => <option key={c}>{c}</option>)}</select>
          <div className="searchBox"><Search size={16} /><input placeholder="Pesquisar jogador, seleção ou código" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </section>
      )}

      {(tab === "album" || tab === "faltas") && (
        <section className="albumGrid">
          {filteredPlayers.map(p => {
            const hasIt = !!owned[viewUser]?.[p.id];
            const reps = duplicates[viewUser]?.[p.id] || 0;
            return (
              <article className="sticker" key={p.id}>
                <div className="photoArea"><span className="flag">{p.flag}</span><span className="code">{p.id}</span><PlayerImage player={p} /></div>
                <div className="info">
                  <h2>{p.player}</h2><p>{p.country}</p>
                  <button className={hasIt ? "have" : "missing"} onClick={() => toggleOwned(p.id)}>{hasIt ? "Tenho" : "Falta"}</button>
                  <button className="photoBtn" onClick={() => updatePhoto(p)}>Foto</button>
                  <div className="dupLine"><span>Repetidos</span><button onClick={() => changeDuplicate(p.id, -1)}>-</button><b>{reps}</b><button onClick={() => changeDuplicate(p.id, 1)}>+</button></div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {tab === "trocas" && (
        <section className="panel">
          <h2><Repeat2 size={20} /> Sugestões de troca</h2>
          {trades.length === 0 ? <p>Ainda não há trocas possíveis. Marca repetidos para aparecerem sugestões.</p> : (
            <div className="trades">{trades.map((t, i) => <div className="trade" key={i}><b>{t.giver.name}</b> pode dar <b>{t.player.player}</b> a <b>{t.receiver.name}</b><span>{t.player.flag} {t.player.country} · {t.player.id}</span></div>)}</div>
          )}
        </section>
      )}

      {tab === "adicionar" && (
        <section className="panel">
          <h2>Adicionar cromo</h2>
          <div className="formGrid">
            <input placeholder="Código: POR04" value={newPlayer.id} onChange={e => setNewPlayer({ ...newPlayer, id: e.target.value })} />
            <input placeholder="Jogador" value={newPlayer.player} onChange={e => setNewPlayer({ ...newPlayer, player: e.target.value })} />
            <input placeholder="Seleção" value={newPlayer.country} onChange={e => setNewPlayer({ ...newPlayer, country: e.target.value })} />
            <input placeholder="Bandeira: 🇵🇹" value={newPlayer.flag} onChange={e => setNewPlayer({ ...newPlayer, flag: e.target.value })} />
            <input placeholder="Link da foto" value={newPlayer.photo} onChange={e => setNewPlayer({ ...newPlayer, photo: e.target.value })} />
            <button className="primary" onClick={addPlayer}>Adicionar</button>
          </div>
          <button className="secondary" onClick={seedAlbum}>Carregar lista inicial</button>
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
