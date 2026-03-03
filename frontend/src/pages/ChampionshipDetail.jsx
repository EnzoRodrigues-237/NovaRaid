import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function ChampionshipDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/championships/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("notfound");
        return r.json();
      })
      .then((json) => {
        setData(json);
        setError("");
      })
      .catch(() => {
        setData(null);
        setError("Campeonato não encontrado ou não publicado.");
      });
  }, [id]);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Vitrine</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>

      {error && <p>{error}</p>}

      {data && (
        <>
          <h1>{data.name}</h1>
          <p>
            Status: <b>{data.status}</b>
          </p>
          <p>ID: {data.id}</p>
        </>
      )}
    </div>
  );
}