import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Splash from './pages/Splash';
import GameSelect from './pages/GameSelect';
import Mode from './pages/Mode';
import PlayerSetup from './pages/PlayerSetup';
import HowToPlay from './pages/HowToPlay';
import SettingsPage from './pages/Settings';
import StatsPage from './pages/Stats';
import LudoGame from './pages/LudoGame';
import SnakesAndLaddersGame from './pages/SnakesAndLaddersGame';

const App: React.FC = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/select" element={<GameSelect />} />
        <Route path="/mode" element={<Mode />} />
        <Route path="/players" element={<PlayerSetup />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/ludo" element={<LudoGame />} />
        <Route path="/snakes-and-ladders" element={<SnakesAndLaddersGame />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
