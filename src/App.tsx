import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import LudoGame from './pages/LudoGame';
import SnakesAndLaddersGame from './pages/SnakesAndLaddersGame';

const App: React.FC = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ludo" element={<LudoGame />} />
        <Route path="/snakes-and-ladders" element={<SnakesAndLaddersGame />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
