import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const users = [
  { name: "Tio Berto", pin: "menurius33" },
  { name: "Sobrinho Rafa", pin: "menurius34" },
  { name: "Sobrinho Gabe", pin: "menurius35" },
];

const players = [
  {
    id: "POR01",
    player: "Cristiano Ronaldo",
    country: "Portugal",
    flag: "🇵🇹",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
  },
  {
    id: "POR02",
    player: "Bruno Fernandes",
    country: "Portugal",
    flag: "🇵🇹",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/7/71/Bruno_Fernandes_2024.jpg",
  },
  {
    id: "ARG01",
    player: "Lionel Messi",
    country: "Argentina",
    flag: "🇦🇷",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg",
  },
  {
    id: "BRA01",
    player: "Vinicius Junior",
    country: "Brasil",
    flag: "🇧🇷",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/4/47/Vinicius_Junior_2023.jpg",
  },
  {
    id: "ESP01",
    player: "Pedri",
    country: "Espanha",
    flag: "🇪🇸",
    photo:
      "https://upload.wikimedia.org/wikipedia/commons/3/33/Pedri_2022.jpg",
  },
];

function App() {
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");
  const [logged, setLogged] = useState(false);

  const login = () => {
    const found = users.find(
      (u) => u.name === selectedUser && u.pin === pin
    );

    if (found) {
      setLogged(true);
    } else {
      alert("Código errado");
    }
  };

  if (!logged) {
    return (
      <div className="login">
        <div className="loginBox">
          <h1>Álbum Mundial 2026</h1>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Escolher utilizador</option>
            {users.map((u) => (
              <option key={u.name}>{u.name}</option>
            ))}
          </select>

          <input
            type="password"
            placeholder="Código"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />

          <button onClick={login}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>🌍 Álbum Mundial 2026</h1>

      <div className="cards">
        {players.map((p) => (
          <div className="card" key={p.id}>
            <img src={p.photo} />

            <div className="info">
              <h2>{p.player}</h2>

              <p>
                {p.flag} {p.country}
              </p>

              <span>{p.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);