import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import axios from 'axios';

const Dashboard = () => {
  const [templates, setTemplates] = useState([]);
  const [syncLink, setSyncLink] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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
    setIsSyncing(true);

    try {
      const response = await axios.get(syncLink);
      const newTemplate = response.data;

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
    } finally {
      setIsSyncing(false);
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
    <div className="page dashboard-page">
      <section className="card">
        <div className="page-header">
          <h1 className="page-title">Survey Management</h1>
          <p className="page-subtitle">
            Sync approved JSON templates to build offline-ready surveys. Existing templates update automatically when a higher version is detected.
          </p>
        </div>

        <form className="template-form" onSubmit={handleSync}>
          <label className="sr-only" htmlFor="sync-url-input">
            Template URL
          </label>
          <div className="input-group">
            <input
              id="sync-url-input"
              type="url"
              value={syncLink}
              onChange={(e) => setSyncLink(e.target.value)}
              placeholder="https://example.com/survey-template.json"
              required
              aria-label="Template sync URL"
            />
            <button type="submit" disabled={!syncLink || isSyncing}>
              {isSyncing ? 'Syncing…' : 'Add template'}
            </button>
          </div>
        </form>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="card card--transparent">
        <div className="card-header">
          <h2 className="section-title">Surveys</h2>
          <span className="badge">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'}
          </span>
        </div>

        {templates.length === 0 ? (
          <div className="empty-state">
            <h3>No templates yet</h3>
            <p>Paste a secure link to your survey template JSON above to get started.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map((template) => {
              const sectionCount = template.sections?.length ?? 0;
              const questionCount = template.sections?.reduce(
                (total, section) => total + (section.questions?.length ?? 0),
                0
              );

              return (
                <article className="card template-card" key={template.id}>
                  <div className="card-header">
                    <div>
                      <h3>{template.title}</h3>
                      {template.description && <p className="template-description">{template.description}</p>}
                    </div>
                    <span className="badge">v{template.version}</span>
                  </div>

                  <p className="template-meta">
                    {sectionCount} {sectionCount === 1 ? 'section' : 'sections'} · {questionCount}{' '}
                    {questionCount === 1 ? 'question' : 'questions'}
                  </p>
                  {template.metadata?.author && (
                    <p className="template-meta">Author: {template.metadata.author}</p>
                  )}

                  <div className="card-footer">
                    <Link to={`/surveys/${template.id}`} className="link-button secondary">
                      Open
                    </Link>
                    <button type="button" className="button-danger" onClick={() => handleDelete(template.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;