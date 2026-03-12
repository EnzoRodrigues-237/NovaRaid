import { BrowserRouter, Routes, Route } from "react-router-dom";
import Vitrine from "./pages/Vitrine";
import ChampionshipDetail from "./pages/ChampionshipDetail";
import Dashboard from "./pages/Dashboard";
import TeamDetail from "./pages/TeamDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Vitrine />} />
        <Route path="/championships/:id" element={<ChampionshipDetail />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}