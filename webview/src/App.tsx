import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import ConversationDetailPage from './pages/ConversationDetailPage';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route path="/project/:projectId/conversation/:id" element={<ConversationDetailPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;