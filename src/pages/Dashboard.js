import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import axios from 'axios';

const Dashboard = () => {
  const [templates, setTemplates] = useState([]);
  const [syncLink, setSyncLink] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const allTemplates = await db.surveyTemplates.toArray();
      setTemplates(allTemplates);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError("Failed to load templates from the database.");
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.get(syncLink);
      const newTemplate = response.data;

      // Validate template
      if (!newTemplate.id || !newTemplate.title || !newTemplate.version || !newTemplate.sections) {
        throw new Error('Invalid survey template format.');
      }

      const existingTemplate = await db.surveyTemplates.get(newTemplate.id);
      if (existingTemplate) {
        if (newTemplate.version > existingTemplate.version) {
          if (window.confirm(`A new version of "${newTemplate.title}" is available. Do you want to update?`)) {
            await db.surveyTemplates.put(newTemplate);
            fetchTemplates();
          }
        } else {
          alert('You already have the latest version of this survey.');
        }
      } else {
        await db.surveyTemplates.put(newTemplate);
        fetchTemplates();
      }

      setSyncLink('');
    } catch (err) {
      setError('Failed to sync or invalid template. Please check the URL and template format.');
      console.error(err);
    }
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template and all its data?')) {
      await db.surveyTemplates.delete(templateId);
      await db.surveyInstances.where('surveyId').equals(templateId).delete();
      fetchTemplates();
    }
  };

  return (
    <div>
      <h1>Survey Templates</h1>
      <form onSubmit={handleSync}>
        <input
          type="url"
          value={syncLink}
          onChange={(e) => setSyncLink(e.target.value)}
          placeholder="Enter Sync Link"
          required
        />
        <button type="submit">Add Template</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {templates.map((template) => (
          <li key={template.id}>
            <Link to={`/surveys/${template.id}`}>{template.title}</Link>
            <button onClick={() => handleDelete(template.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;