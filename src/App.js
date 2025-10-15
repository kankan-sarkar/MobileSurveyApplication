import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SurveyInstances from './pages/SurveyInstances';
import SurveyForm from './pages/SurveyForm';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/surveys/:surveyId" element={<SurveyInstances />} />
        <Route path="/surveys/:surveyId/instances/:instanceId" element={<SurveyForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;