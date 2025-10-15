import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const SurveyInstances = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [template, setTemplate] = useState(null);
  const DISPLAY_QUESTION_IDS = ['title'];

  useEffect(() => {
    fetchTemplate();
    fetchInstances();
  }, [surveyId]);

  const fetchTemplate = async () => {
    const tpl = await db.surveyTemplates.get(surveyId);
    setTemplate(tpl);
  };

  const fetchInstances = async () => {
    const allInstances = await db.surveyInstances.where('surveyId').equals(surveyId).toArray();
    setInstances(allInstances);
  };

  const questionMap = useMemo(() => {
    if (!template) return {};
    return (template.sections ?? []).reduce((acc, section) => {
      (section.questions ?? []).forEach((question) => {
        acc[question.id] = { ...question, sectionTitle: section.title };
      });
      return acc;
    }, {});
  }, [template]);

  const shouldDisplayQuestion = (questionId) => {
    if (DISPLAY_QUESTION_IDS.length === 0) return true;
    return DISPLAY_QUESTION_IDS.includes(questionId);
  };

  const renderAnswer = (questionId, answer) => {
    if (!shouldDisplayQuestion(questionId)) {
      return null;
    }

    const question = questionMap[questionId];
    const label = question ? question.label : questionId;

    let displayValue = 'No response';
    if (typeof answer === 'string' && answer.trim().length > 0) {
      displayValue = answer;
    } else if (answer && typeof answer === 'object') {
      if (answer.latitude !== undefined && answer.longitude !== undefined) {
        displayValue = `Lat: ${answer.latitude}, Lon: ${answer.longitude}`;
      } else if (answer.name) {
        displayValue = `Attachment: ${answer.name}`;
      } else if (answer.filename) {
        displayValue = `Attachment: ${answer.filename}`;
      } else {
        displayValue = JSON.stringify(answer);
      }
    }

    return (
      <div className="answer-row" key={questionId}>
        <span className="answer-label">{label}</span>
        <span className="answer-value">{displayValue}</span>
      </div>
    );
  };

  const getPrimaryTitle = (instance) => {
    const answers = instance.answers || {};

    for (const questionId of DISPLAY_QUESTION_IDS) {
      const answer = answers[questionId];
      if (typeof answer === 'string' && answer.trim().length > 0) {
        return answer;
      }
    }

    return template?.title ?? 'Survey instance';
  };

  const formatDateTime = (value) => {
    if (!value) return 'Unknown date';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const handleCreate = async () => {
    const newInstance = {
      surveyId,
      createdAt: new Date(),
      answers: {},
    };
    const id = await db.surveyInstances.add(newInstance);
    navigate(`/surveys/${surveyId}/instances/${id}`);
  };

  const handleDelete = async (instanceId) => {
    if (window.confirm('Are you sure you want to delete this instance?')) {
      await db.surveyInstances.delete(instanceId);
      fetchInstances();
    }
  };

  const handleExport = async () => {
    if (instances.length === 0) {
      return;
    }

    const zip = new JSZip();
    const results = [];
    const attachmentsFolder = zip.folder('attachments');
    const surveyTitle = template?.title?.replace(/\s+/g, '_').toLowerCase() || 'survey-results';

    for (const instance of instances) {
      const result = {
        instanceId: instance.instanceId,
        createdAt: instance.createdAt,
        answers: {},
      };

      for (const questionId in instance.answers) {
        const answer = instance.answers[questionId];
        if (answer && answer.data) { // File or photo
          const blob = await fetch(answer.data).then(res => res.blob());
          const filename = `instance-${instance.instanceId}_question-${questionId}_${answer.name}`;
          attachmentsFolder.file(filename, blob);
          result.answers[questionId] = { filename };
        } else { // Text, dropdown, or location
          result.answers[questionId] = answer;
        }
      }
      results.push(result);
    }

    zip.file('results.json', JSON.stringify(results, null, 2));
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${surveyTitle}-export.zip`);
  };

  const isExportDisabled = instances.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{template ? `${template.title} instances` : 'Survey instances'}</h1>
        <p className="page-subtitle">Review, edit, or export collected responses for this survey.</p>
      </div>

      <section className="card">
        <div className="instances-toolbar">
          <div className="instances-toolbar__primary">
            <button type="button" className="button-secondary" onClick={() => navigate('/')}
            >
              Back to dashboard
            </button>
          </div>
          <div className="instances-toolbar__actions">
            <button type="button" className="button-secondary" onClick={handleCreate}>
              New instance
            </button>
            <button type="button" onClick={handleExport} disabled={isExportDisabled}>
              Export all
            </button>
          </div>
        </div>
      </section>

      <section className="card card--transparent">
        {instances.length === 0 ? (
          <div className="empty-state">
            <h3>No submissions yet</h3>
            <p>Create a new instance to start collecting responses for this survey.</p>
          </div>
        ) : (
          <div className="instance-list">
            {instances.map((instance) => {
              const answers = instance.answers || {};
              const primaryTitle = getPrimaryTitle(instance);
              const submittedAt = formatDateTime(instance.createdAt);

              return (
                <article className="card instance-card" key={instance.instanceId}>
                  <header className="instance-header">
                    <div>
                      <h2>{primaryTitle}</h2>
                      <p className="instance-meta">Submitted {submittedAt}</p>
                    </div>
                    <div className="instance-badge">#{instance.instanceId}</div>
                  </header>

                  <div className="instance-details">
                    {Object.keys(answers).length === 0 ? (
                      <p className="instance-empty">No answers recorded.</p>
                    ) : (
                      <div className="answer-stack">
                        {Object.entries(answers)
                          .map(([questionId, answer]) => renderAnswer(questionId, answer))
                          .filter(Boolean)}
                      </div>
                    )}
                  </div>

                  <footer className="inline-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => navigate(`/surveys/${surveyId}/instances/${instance.instanceId}`)}
                    >
                      View or edit
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleDelete(instance.instanceId)}
                    >
                      Delete
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default SurveyInstances;