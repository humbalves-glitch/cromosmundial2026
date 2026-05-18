
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Users, Cloud, CheckCircle2, Circle, Repeat2, Trash2 } from "lucide-react";
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

const albumId = "mundial-2026-familia";
const collectors = ["Tio", "Sobrinho 1", "Sobrinho 2"];

const starterStickers = [
  { id: "POR-01", country: "Portugal", player: "Cristiano Ronaldo" },
  { id: "POR-02", country: "Portugal", player: "Bruno Fernandes" },
  { id: "POR-03", country: "Portugal", player: "Rúben Dias" },
  { id: "ARG-01", country: "Argentina", player: "Lionel Messi" },
  { id: "ARG-02", country: "Argentina", player: "Lautaro Martínez" },
  { id: "BRA-01", country: "Brasil", player: "Vinícius Júnior" },
  { id: "BRA-02", country: "Brasil", player: "Rodrygo" },
  { id: "ESP-01", country: "Espanha", player: "Pedri" },
  { id: "ESP-02", country: "Espanha", player: "Lamine Yamal" },
  { id: "FRA-01", country: "França", player: "Kylian Mbappé" },
  { id: "ENG-01", country: "Inglaterra", player: "Jude Bellingham" },
  { id: "GER-01", country: "Alemanha", player: "Florian Wirtz" },
];

function App() {
  const [stickers, setStickers] = useState(starterStickers);
  const [owned, setOwned] = useState({});
  const [duplicates, setDuplicates] = useState({});
  const [selected, setSelected] = useState(collectors[0]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("colecao");
  const [newSticker, setNewSticker] = useState({ id: "", country: "", player: "" });
  const [syncStatus, setSyncStatus] = useState("A sincronizar...");

  useEffect(() => {
    const unsubStickers = onSnapshot(collection(db, "albums", albumId, "stickers"), (snapshot) => {
      const data = snapshot.docs.map((d) => d.data()).sort((a, b) => a.id.localeCompare(b.id));
      if (data.length > 0) setStickers(data);
      setSyncStatus("Sincronizado em tempo real");
    });

    const unsubOwned = onSnapshot(collection(db, "albums", albumId, "owned"), (snapshot) => {
      const next = {};
      snapshot.docs.forEach((d) => { next[d.id] = d.data().stickers || {}; });
      setOwned(next);
    });

    const unsubDuplicates = onSnapshot(collection(db, "albums", albumId, "duplicates"), (snapshot) => {
      const next = {};
      snapshot.docs.forEach((d) => { next[d.id] = d.data().stickers || {}; });
      setDuplicates(next);
    });

    return () => {
      unsubStickers();
      unsubOwned();
      unsubDuplicates();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stickers;
    return stickers.filter((s) =>
      s.id.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.player.toLowerCase().includes(q)
    );
  }, [query, stickers]);

  const stats = useMemo(() => collectors.map((name) => {
    const totalOwned = stickers.filter((s) => owned[name]?.[s.id]).length;
    return {
      name,
      totalOwned,
      missing: stickers.length - totalOwned,
      percent: stickers.length ? Math.round((totalOwned / stickers.length) * 100) : 0,
    };
  }), [stickers, owned]);

  const toggleOwned = async (collector, stickerId) => {
    const nextCollectorData = {
      ...(owned[collector] || {}),
      [stickerId]: !owned[collector]?.[stickerId],
    };
    setOwned((prev) => ({ ...prev, [collector]: nextCollectorData }));
    await setDoc(doc(db, "albums", albumId, "owned", collector), { stickers: nextCollectorData });
  };

  const changeDuplicate = async (collector, stickerId, amount) => {
    const current = duplicates[collector]?.[stickerId] || 0;
    const nextAmount = Math.max(0, current + amount);
    const nextCollectorData = {
      ...(duplicates[collector] || {}),
      [stickerId]: nextAmount,
    };
    setDuplicates((prev) => ({ ...prev, [collector]: nextCollectorData }));
    await setDoc(doc(db, "albums", albumId, "duplicates", collector), { stickers: nextCollectorData });
  };

  const addSticker = async () => {
    const id = newSticker.id.trim().toUpperCase();
    const country = newSticker.country.trim();
    const player = newSticker.player.trim();
    if (!id || !country || !player) return;
    if (stickers.some((s) => s.id === id)) return alert("Esse código já existe.");

    const sticker = { id, country, player };
    setStickers((prev) => [...prev, sticker]);
    await setDoc(doc(db, "albums", albumId, "stickers", id), sticker);
    setNewSticker({ id: "", country: "", player: "" });
  };

  const removeSticker = async (id) => {
    if (!confirm("Queres mesmo apagar este cromo?")) return;
    setStickers((prev) => prev.filter((s) => s.id !== id));
    await deleteDoc(doc(db, "albums", albumId, "stickers", id));
  };

  const seedInitialAlbum = async () => {
    for (const sticker of starterStickers) {
      await setDoc(doc(db, "albums", albumId, "stickers", sticker.id), sticker);
    }
    alert("Lista inicial carregada.");
  };

  const neededBySelected = stickers.filter((s) => !owned[selected]?.[s.id]);

  const tradeSuggestions = useMemo(() => {
    const suggestions = [];
    for (const receiver of collectors) {
      for (const giver of collectors) {
        if (receiver === giver) continue;
        for (const sticker of stickers) {
          const receiverNeeds = !owned[receiver]?.[sticker.id];
          const giverHasDuplicate = (duplicates[giver]?.[sticker.id] || 0) > 0;
          if (receiverNeeds && giverHasDuplicate) {
            suggestions.push({ receiver, giver, sticker });
          }
        }
      }
    }
    return suggestions;
  }, [stickers, owned, duplicates]);

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Cromos Mundial 2026</h1>
          <p>Coleção familiar com faltas, repetidos e sugestões de troca.</p>
        </div>
        <div>
          <div className="status"><Users size={18} /> {collectors.length} colecionadores</div>
          <p><Cloud size={14} /> {syncStatus}</p>
        </div>
      </div>

      <div className="grid3">
        {stats.map((s) => (
          <div className="card" key={s.name}>
            <h2>{s.name} <span style={{float:"right"}}>{s.percent}%</span></h2>
            <div className="progress"><div className="bar" style={{width: `${s.percent}%`}} /></div>
            <p>Tem <b>{s.totalOwned}</b> de <b>{stickers.length}</b>. Faltam <b>{s.missing}</b>.</p>
          </div>
        ))}
      </div>

      <div className="tabs">
        <button className={tab === "colecao" ? "active" : ""} onClick={() => setTab("colecao")}>Coleção</button>
        <button className={tab === "faltas" ? "active" : ""} onClick={() => setTab("faltas")}>Faltas</button>
        <button className={tab === "trocas" ? "active" : ""} onClick={() => setTab("trocas")}>Trocas</button>
      </div>

      {tab === "colecao" && (
        <div className="card">
          <div className="controls">
            <div className="collectors">
              {collectors.map((name) => (
                <button key={name} className={selected === name ? "active" : ""} onClick={() => setSelected(name)}>{name}</button>
              ))}
            </div>
            <input className="search" placeholder="Pesquisar por país, jogador ou código" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="list">
            {filtered.map((s) => {
              const hasIt = !!owned[selected]?.[s.id];
              const reps = duplicates[selected]?.[s.id] || 0;
              return (
                <div className="sticker" key={s.id}>
                  <div className="sticker-main" onClick={() => toggleOwned(selected, s.id)}>
                    {hasIt ? <CheckCircle2 /> : <Circle />}
                    <div>
                      <b>{s.player}</b>
                      <div className="code">{s.id} · {s.country}</div>
                    </div>
                  </div>
                  <div className="dup">
                    <button onClick={() => changeDuplicate(selected, s.id, -1)}>-</button>
                    <b>{reps}</b>
                    <button onClick={() => changeDuplicate(selected, s.id, 1)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "faltas" && (
        <div className="card">
          <div className="collectors">
            {collectors.map((name) => (
              <button key={name} className={selected === name ? "active" : ""} onClick={() => setSelected(name)}>{name}</button>
            ))}
          </div>
          <h2>Faltam a {selected}: {neededBySelected.length}</h2>
          <div className="list">
            {neededBySelected.map((s) => (
              <div className="sticker" key={s.id}>
                <div>
                  <b>{s.player}</b>
                  <div className="code">{s.id} · {s.country}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "trocas" && (
        <div className="card">
          <h2><Repeat2 size={20} /> Sugestões de troca</h2>
          {tradeSuggestions.length === 0 ? (
            <p>Ainda não há trocas possíveis. Marca repetidos para aparecerem sugestões.</p>
          ) : (
            <div className="list">
              {tradeSuggestions.map((t, index) => (
                <div className="sticker" key={`${t.receiver}-${t.giver}-${t.sticker.id}-${index}`}>
                  <div>
                    <b>{t.giver} pode dar a {t.receiver}</b>
                    <div className="code">{t.sticker.id} · {t.sticker.player} · {t.sticker.country}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>Adicionar cromo</h2>
        <div className="add-grid">
          <input placeholder="Código: POR-04" value={newSticker.id} onChange={(e) => setNewSticker({ ...newSticker, id: e.target.value })} />
          <input placeholder="País" value={newSticker.country} onChange={(e) => setNewSticker({ ...newSticker, country: e.target.value })} />
          <input placeholder="Jogador" value={newSticker.player} onChange={(e) => setNewSticker({ ...newSticker, player: e.target.value })} />
          <button className="primary" onClick={addSticker}>Adicionar</button>
        </div>
        <p><button onClick={seedInitialAlbum}>Carregar lista inicial</button></p>
        <div className="small-list">
          {stickers.map((s) => (
            <div className="small-item" key={s.id}>
              <span>{s.id} · {s.player}</span>
              <button onClick={() => removeSticker(s.id)}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
