import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SurveyInstances from './pages/SurveyInstances';
import SurveyForm from './pages/SurveyForm';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark">📱</span>
          <span className="brand-text">Mobile Survey</span>
        </Link>
        <nav className="app-nav">
          <Link to="/" className="nav-link">Dashboard</Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/surveys/:surveyId" element={<SurveyInstances />} />
          <Route path="/surveys/:surveyId/instances/:instanceId" element={<SurveyForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>Mobile Survey Application · Capture, manage, and export field data offline.</p>
      </footer>
    </div>
  );
}

export default App;