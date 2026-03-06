import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { saveToken, getToken, clearToken } from "../auth";

export default function Dashboard() {
  const [status, setStatus] = useState("carregando...");
  const [api, setApi] = useState(null);

  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("Enzo");
  const [email, setEmail] = useState("enzo@test.com");
  const [password, setPassword] = useState("123456");

  const [me, setMe] = useState(null);
  const [authError, setAuthError] = useState("");

  const [championships, setChampionships] = useState([]);
  const [newChampName, setNewChampName] = useState("");
  const [champError, setChampError] = useState("");

  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamType, setNewTeamType] = useState("common"); 
  const [teamError, setTeamError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("erro ao conectar"));

    fetch(`${API_BASE_URL}/version`)
      .then((r) => r.json())
      .then((data) => setApi(data))
      .catch(() => setApi({ name: "NovaRaid API", version: "erro" }));

    loadChampionships();
    loadTeams();

    const token = getToken();
    if (token) {
      fetchMe(token);
    }
  }, []);

  function flashMessage(msg) {
    setChampError(msg);
    window.setTimeout(() => setChampError(""), 2000);
  }

  function copyPublicLink(championshipId) {
    const url = `${window.location.origin}/championships/${championshipId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => flashMessage("Link copiado!"))
      .catch(() => setChampError("Não consegui copiar. Copie manualmente: " + url));
  }

  function loadChampionships() {
    fetch(`${API_BASE_URL}/championships`)
      .then((r) => r.json())
      .then((data) => setChampionships(data))
      .catch(() => setChampionships([]));
  }

  function loadTeams() {
    const token = getToken();
    if (!token) {
      setTeams([]);
      return;
    }

    fetch(`${API_BASE_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("generic");
        return r.json();
      })
      .then((data) => setTeams(data))
      .catch(() => setTeams([]));
  }

  function handleCreateTeam(e) {
    e.preventDefault();
    setTeamError("");

    const name = newTeamName.trim();
    if (!name) {
      setTeamError("Digite um nome para o time.");
      return;
    }

    const token = getToken();
    if (!token) {
      setTeamError("Você precisa estar logado.");
      return;
    }

    fetch(`${API_BASE_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, team_type: newTeamType }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("generic");
        return r.json();
      })
      .then(() => {
        setNewTeamName("");
        setNewTeamType("common");
        loadTeams();
      })
      .catch(() => setTeamError("Erro ao criar time."));
  }

  function fetchMe(token) {
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Token inválido");
        return r.json();
      })
      .then((data) => setMe(data))
      .catch(() => {
        clearToken();
        setMe(null);
      });
  }

  async function loginWith(emailValue, passwordValue) {
    const body = new URLSearchParams();
    body.append("username", emailValue);
    body.append("password", passwordValue);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) throw new Error("Credenciais inválidas");

    const data = await res.json();
    saveToken(data.access_token);

    fetchMe(data.access_token);
    loadTeams();
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");

    const eMail = email.trim();
    const pwd = password;

    try {
      if (mode === "register") {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: eMail, password: pwd }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          const msg = err?.detail || "Erro ao criar conta";
          throw new Error(msg);
        }

        await loginWith(eMail, pwd);
      } else {
        await loginWith(eMail, pwd);
      }
    } catch (err) {
      setAuthError(err?.message || "Erro");
    }
  }

  function handleLogout() {
    clearToken();
    setMe(null);
    setTeams([]);
  }

  function handleCreateChampionship(e) {
    e.preventDefault();
    setChampError("");

    const champName = newChampName.trim();
    if (!champName) {
      setChampError("Digite um nome para o campeonato.");
      return;
    }

    const token = getToken();
    if (!token) {
      setChampError("Você precisa estar logado para criar um campeonato.");
      return;
    }

    fetch(`${API_BASE_URL}/championships`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: champName, status: "draft" }),
    })
      .then(async (r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error("generic");
        return r.json();
      })
      .then(() => {
        setNewChampName("");
        loadChampionships();
      })
      .catch((err) => {
        if (err.message === "unauthorized") {
          clearToken();
          setMe(null);
          setChampError("Sua sessão expirou. Faça login novamente.");
          return;
        }
        setChampError("Erro ao criar campeonato.");
      });
  }

  function handlePublishChampionship(championshipId) {
    setChampError("");
    const token = getToken();
    if (!token) {
      setChampError("Você precisa estar logado para publicar.");
      return;
    }

    fetch(`${API_BASE_URL}/championships/${championshipId}/publish`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error("generic");
        return r.json();
      })
      .then(() => loadChampionships())
      .catch((err) => {
        if (err.message === "unauthorized") {
          clearToken();
          setMe(null);
          setChampError("Sua sessão expirou. Faça login novamente.");
          return;
        }
        setChampError("Erro ao publicar.");
      });
  }

  function handleUnpublishChampionship(championshipId) {
    setChampError("");
    const token = getToken();
    if (!token) {
      setChampError("Você precisa estar logado para despublicar.");
      return;
    }

    fetch(`${API_BASE_URL}/championships/${championshipId}/unpublish`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error("generic");
        return r.json();
      })
      .then(() => loadChampionships())
      .catch((err) => {
        if (err.message === "unauthorized") {
          clearToken();
          setMe(null);
          setChampError("Sua sessão expirou. Faça login novamente.");
          return;
        }
        setChampError("Erro ao despublicar.");
      });
  }

  function handleDeleteChampionship(championshipId) {
    setChampError("");
    const token = getToken();
    if (!token) {
      setChampError("Você precisa estar logado para excluir.");
      return;
    }

    const ok = confirm("Tem certeza que deseja excluir este campeonato?");
    if (!ok) return;

    fetch(`${API_BASE_URL}/championships/${championshipId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (r.status === 204) return;
        throw new Error("generic");
      })
      .then(() => loadChampionships())
      .catch((err) => {
        if (err.message === "unauthorized") {
          clearToken();
          setMe(null);
          setChampError("Sua sessão expirou. Faça login novamente.");
          return;
        }
        setChampError("Erro ao excluir.");
      });
  }

  const drafts = championships.filter((c) => c.status === "draft");
  const published = championships.filter((c) => c.status === "published");

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>NovaRaid</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Vitrine</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>

      <p>
        API status: <b>{status}</b>
      </p>

      <p>
        API: <b>{api ? `${api.name} v${api.version}` : "carregando..."}</b>
      </p>

      <hr style={{ margin: "16px 0" }} />

      {!me ? (
        <>
          <h2>{mode === "login" ? "Login" : "Criar conta"}</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => {
                setMode("login");
                setAuthError("");
              }}
              style={{ padding: "6px 10px" }}
              disabled={mode === "login"}
            >
              Entrar
            </button>

            <button
              onClick={() => {
                setMode("register");
                setAuthError("");
              }}
              style={{ padding: "6px 10px" }}
              disabled={mode === "register"}
            >
              Criar conta
            </button>
          </div>

          <form
            onSubmit={handleAuthSubmit}
            style={{ display: "grid", gap: 8, maxWidth: 320 }}
          >
            {mode === "register" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
                style={{ padding: 8 }}
              />
            )}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              style={{ padding: 8 }}
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              type="password"
              style={{ padding: 8 }}
            />

            <button type="submit" style={{ padding: "8px 12px" }}>
              {mode === "login" ? "Entrar" : "Criar e entrar"}
            </button>
          </form>

          {authError && <p style={{ marginTop: 8 }}>{authError}</p>}
        </>
      ) : (
        <>
          <h2>Você está logado</h2>
          <p>
            <b>{me.name}</b> — {me.email}
          </p>
          <button onClick={handleLogout} style={{ padding: "8px 12px" }}>
            Sair
          </button>
        </>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Campeonatos</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={loadChampionships} style={{ padding: "6px 10px" }}>
          Atualizar lista
        </button>
        <span style={{ alignSelf: "center" }}>
          Total: <b>{championships.length}</b> — Draft: <b>{drafts.length}</b> — Published:{" "}
          <b>{published.length}</b>
        </span>
      </div>

      {me && (
        <>
          <form
            onSubmit={handleCreateChampionship}
            style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <input
              value={newChampName}
              onChange={(e) => setNewChampName(e.target.value)}
              placeholder="Nome do campeonato"
              style={{ padding: 8, width: 280 }}
            />
            <button type="submit" style={{ padding: "8px 12px" }}>
              Criar (rascunho)
            </button>
          </form>

          {champError && <p style={{ marginTop: 0 }}>{champError}</p>}
        </>
      )}

      <h3>Rascunhos (draft)</h3>
      {drafts.length === 0 ? (
        <p>Nenhum rascunho.</p>
      ) : (
        <ul>
          {drafts.map((c) => (
            <li key={c.id} style={{ marginBottom: 6 }}>
              <b>{c.name}</b> — <span>{c.status}</span>
              {me && (
                <>
                  <button
                    onClick={() => handlePublishChampionship(c.id)}
                    style={{ marginLeft: 10, padding: "4px 8px" }}
                  >
                    Publicar
                  </button>
                  <button
                    onClick={() => handleDeleteChampionship(c.id)}
                    style={{ marginLeft: 8, padding: "4px 8px" }}
                  >
                    Excluir
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3>Publicados (published)</h3>
      {published.length === 0 ? (
        <p>Nenhum publicado.</p>
      ) : (
        <ul>
          {published.map((c) => (
            <li key={c.id} style={{ marginBottom: 6 }}>
              <b>{c.name}</b> — <span>{c.status}</span>

              {me && (
                <>
                  <button
                    onClick={() => navigate(`/championships/${c.id}`)}
                    style={{ marginLeft: 10, padding: "4px 8px" }}
                  >
                    Ver detalhe
                  </button>

                  <button
                    onClick={() => copyPublicLink(c.id)}
                    style={{ marginLeft: 8, padding: "4px 8px" }}
                  >
                    Copiar link
                  </button>

                  <button
                    onClick={() => handleUnpublishChampionship(c.id)}
                    style={{ marginLeft: 8, padding: "4px 8px" }}
                  >
                    Despublicar
                  </button>

                  <button
                    onClick={() => handleDeleteChampionship(c.id)}
                    style={{ marginLeft: 8, padding: "4px 8px" }}
                  >
                    Excluir
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Times</h2>

      {me ? (
        <>
          <form
            onSubmit={handleCreateTeam}
            style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nome do time"
              style={{ padding: 8, width: 280 }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              Tipo:
              <select
                value={newTeamType}
                onChange={(e) => setNewTeamType(e.target.value)}
                style={{ padding: 8 }}
              >
                <option value="common">Comum</option>
                <option value="university">Universitário</option>
                <option value="professional">Profissional</option>
              </select>
            </label>

            <button type="submit" style={{ padding: "8px 12px" }}>
              Criar time
            </button>

            <button type="button" onClick={loadTeams} style={{ padding: "8px 12px" }}>
              Atualizar
            </button>
          </form>

          {teamError && <p style={{ marginTop: 0 }}>{teamError}</p>}

          {teams.length === 0 ? (
            <p>Nenhum time cadastrado.</p>
          ) : (
            <ul>
              {teams.map((t) => (
                <li key={t.id}>
                  <b>{t.name}</b> —{" "}
                  {t.team_type === "university"
                    ? "Universitário"
                    : t.team_type === "professional"
                    ? "Profissional"
                    : "Comum"}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p>Faça login para gerenciar times.</p>
      )}
    </div>
  );
}