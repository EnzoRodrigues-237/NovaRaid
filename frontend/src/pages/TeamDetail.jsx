import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { getToken } from "../auth";

export default function TeamDetail() {
  const { id } = useParams();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Faça login para visualizar o time.");
      return;
    }

    fetch(`${API_BASE_URL}/teams/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("team");
        return r.json();
      })
      .then((data) => setTeam(data))
      .catch(() => setError("Time não encontrado."));

    fetch(`${API_BASE_URL}/teams/${id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("members");
        return r.json();
      })
      .then((data) => setMembers(data))
      .catch(() => setMembers([]));
  }, [id]);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Vitrine</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>

      <Link to="/dashboard">← Voltar</Link>

      {error && <p style={{ marginTop: 16 }}>{error}</p>}

      {team && (
        <>
          <h1 style={{ marginTop: 16 }}>{team.name}</h1>

          <p>
            Tipo:{" "}
            <b>
              {team.team_type === "university"
                ? "Universitário"
                : team.team_type === "professional"
                ? "Profissional"
                : "Comum"}
            </b>
          </p>

          <h2>Elenco</h2>

          {members.length === 0 ? (
            <p>Nenhum membro cadastrado.</p>
          ) : (
            <ul>
              {members.map((m) => (
                <li key={m.id}>
                  <b>{m.nick}</b> — {m.name} ({m.game_id})
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}