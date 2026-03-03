import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Vitrine() {
  const [championships, setChampionships] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/championships`)
      .then((r) => r.json())
      .then((data) => setChampionships(data))
      .catch(() => setChampionships([]));
  }, []);

  const sorted = useMemo(() => {
    return [...championships].sort((a, b) =>
      String(a.name).localeCompare(String(b.name), "pt-BR", { sensitivity: "base" })
    );
  }, [championships]);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>NovaRaid</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Vitrine</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>

      <h2>Vitrine de Campeonatos</h2>
      <p>
        Abertos ao público: <b>{sorted.length}</b>
      </p>

      {sorted.length === 0 ? (
        <p>Nenhum campeonato publicado.</p>
      ) : (
        <ul>
          {sorted.map((c) => (
            <li key={c.id}>
              <Link to={`/championships/${c.id}`}>{c.name}</Link> — {c.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 