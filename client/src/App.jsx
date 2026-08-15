import React, { useState } from "react";
import HomeScreen from "./screens/HomeScreen.jsx";
import CollectionScreen from "./screens/CollectionScreen.jsx";
import FormationScreen from "./screens/FormationScreen.jsx";
import CampaignScreen from "./screens/CampaignScreen.jsx";
import MultiplayerScreen from "./screens/MultiplayerScreen.jsx";

export default function App() {
  const [screen, setScreen] = useState("home");
  const goHome = () => setScreen("home");

  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen onNavigate={setScreen} />}
      {screen === "collection" && <CollectionScreen onBack={goHome} />}
      {screen === "formation" && <FormationScreen onBack={goHome} />}
      {screen === "campaign" && <CampaignScreen onBack={goHome} />}
      {screen === "multiplayer" && <MultiplayerScreen onBack={goHome} />}
    </div>
  );
}
