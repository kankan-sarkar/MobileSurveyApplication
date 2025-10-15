import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db/db';

const SurveyForm = () => {
  const { surveyId, instanceId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [instance, setInstance] = useState(null);
  const [answers, setAnswers] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [submissionState, setSubmissionState] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const originalAnswersRef = useRef({});
  const questionRefs = useRef({});

  const fetchInstanceData = useCallback(async () => {
    const tpl = await db.surveyTemplates.get(surveyId);
  const inst = await db.surveyInstances.get(parseInt(instanceId, 10));
    setTemplate(tpl);
    setInstance(inst);

    const initialAnswers = inst?.answers ? JSON.parse(JSON.stringify(inst.answers)) : {};
    setAnswers(initialAnswers);
    originalAnswersRef.current = initialAnswers;
  }, [surveyId, instanceId]);

  useEffect(() => {
    fetchInstanceData();
  }, [fetchInstanceData]);

  const clearValidationError = (questionId) => {
    setValidationErrors((prev) => (prev.includes(questionId) ? prev.filter((id) => id !== questionId) : prev));
  };

  const resetBanner = () => {
    setSubmissionState(null);
    setStatusMessage('');
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearValidationError(questionId);
    if (submissionState === 'error') {
      resetBanner();
    }
  };

  const handleFileChange = async (questionId, file) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleAnswerChange(questionId, {
        name: file.name,
        type: file.type,
        data: event.target.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLocation = (questionId) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleAnswerChange(questionId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setSubmissionState('error');
          setStatusMessage('We could not capture your location. Please enable location access and try again.');
        }
      );
    } else {
      setSubmissionState('error');
      setStatusMessage('Geolocation is not supported by this device. Please enter this information manually if required.');
    }
  };

  const isQuestionAnswered = (question, value) => {
    if (!question?.required) {
      return true;
    }

    switch (question.type) {
      case 'textbox':
      case 'dropdown':
      case 'date':
      case 'time':
      case 'datetime':
      case 'datetime-local': {
        return typeof value === 'string' && value.trim().length > 0;
      }
      case 'location': {
        return (
          value &&
          typeof value === 'object' &&
          value.latitude !== undefined &&
          value.longitude !== undefined &&
          value.latitude !== null &&
          value.longitude !== null
        );
      }
      case 'camera':
      case 'attachment': {
        if (!value) {
          return false;
        }
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        if (typeof value === 'object') {
          return Boolean(value.data || value.name);
        }
        return false;
      }
      default:
        return value !== undefined && value !== null && value !== '';
    }
  };

  const findMissingRequiredQuestions = () => {
    const missing = [];
    (template?.sections ?? []).forEach((section) => {
      (section?.questions ?? []).forEach((question) => {
        if (!question.required) {
          return;
        }

        const value = answers[question.id];
        if (!isQuestionAnswered(question, value)) {
          missing.push(question.id);
        }
      });
    });
    return missing;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const missingQuestions = findMissingRequiredQuestions();

    if (missingQuestions.length > 0) {
      setValidationErrors(missingQuestions);
      setSubmissionState('error');
      setStatusMessage('Please complete the highlighted required fields before submitting.');

      const firstMissingId = missingQuestions[0];
      const target = questionRefs.current[firstMissingId];
      if (target?.scrollIntoView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.focus({ preventScroll: true });
      }
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    try {
    await db.surveyInstances.update(parseInt(instanceId, 10), { answers });
      setSubmissionState('success');
      setStatusMessage('Survey responses saved successfully. You can safely return to your survey library.');
    } catch (err) {
      console.error('Failed to save survey instance', err);
      setSubmissionState('error');
      setStatusMessage('Something went wrong while saving your responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const originalAnswers = originalAnswersRef.current || {};
    setAnswers(originalAnswers);
    setValidationErrors([]);
    resetBanner();
    navigate(`/surveys/${surveyId}`);
  };

  const formatCoordinate = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(5);
    }
    return value ?? '—';
  };

  if (!template || !instance) {
    return (
      <div className="page">
        <div className="card" role="status">Loading survey…</div>
      </div>
    );
  }

  return (
    <div className="page survey-form-page">
      <div className="page-header">
        <h1 className="page-title">{template.title}</h1>
        {template.description && <p className="page-subtitle">{template.description}</p>}
      </div>

      <form className="card form-shell" onSubmit={handleSubmit}>
        {(template.sections ?? []).map((section) => (
          <section className="form-section" key={section.id}>
            <div className="section-header">
              <h2>{section.title}</h2>
              {section.description && <p className="section-subtitle">{section.description}</p>}
            </div>

            <div className="question-stack">
              {(section.questions ?? []).map((q) => {
                const controlId = `${section.id}-${q.id}`;
                const answer = answers[q.id];
                const hasError = validationErrors.includes(q.id);

                return (
                  <div
                    className={`question-card${hasError ? ' question-card--error' : ''}`}
                    key={q.id}
                    ref={(el) => {
                      if (el) {
                        questionRefs.current[q.id] = el;
                      }
                    }}
                    tabIndex={hasError ? -1 : undefined}
                  >
                    <div className="question-header">
                      <label className="question-label" htmlFor={controlId}>
                        {q.label}
                      </label>
                      {q.required && <span className="badge badge-soft">Required</span>}
                    </div>
                    {q.description && <p className="question-help">{q.description}</p>}

                    <div className="question-control">
                      {q.type === 'textbox' && (
                        <textarea
                          id={controlId}
                          value={answer || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder}
                        />
                      )}

                      {q.type === 'dropdown' && (
                        <select
                          id={controlId}
                          value={answer || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        >
                          <option value="">Select…</option>
                          {Array.isArray(q.options) &&
                            q.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                        </select>
                      )}

                      {(q.type === 'date' || q.type === 'time' || q.type === 'datetime' || q.type === 'datetime-local') && (
                        <input
                          id={controlId}
                          type={q.type === 'datetime' ? 'datetime-local' : q.type === 'datetime-local' ? 'datetime-local' : q.type}
                          value={answer || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder}
                          min={q.min}
                          max={q.max}
                          step={q.step}
                        />
                      )}

                      {q.type === 'camera' && (
                        <div className="upload-control">
                          <input
                            id={controlId}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileChange(q.id, e.target.files?.[0])}
                          />
                          {answer?.name && <p className="file-meta">Attached: {answer.name}</p>}
                        </div>
                      )}

                      {q.type === 'attachment' && (
                        <div className="upload-control">
                          <input
                            id={controlId}
                            type="file"
                            accept={q.accept}
                            onChange={(e) => handleFileChange(q.id, e.target.files?.[0])}
                          />
                          {answer?.name && <p className="file-meta">Attached: {answer.name}</p>}
                        </div>
                      )}

                      {q.type === 'location' && (
                        <div className="location-control">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleLocation(q.id)}
                          >
                            Capture location
                          </button>
                          {answer && (
                            <div className="location-value" aria-live="polite">
                              <span>Lat: {formatCoordinate(answer.latitude)}</span>
                              <span>Lon: {formatCoordinate(answer.longitude)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {hasError && <p className="validation-hint">This field is required.</p>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="form-actions">
          <button type="button" className="button-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Submit'}
          </button>
        </div>

        {submissionState && (
          <div
            className={`form-banner form-banner--${submissionState}`}
            role="status"
            aria-live="assertive"
          >
            <div className="form-banner__message">{statusMessage}</div>
            <div className="form-banner__actions">
              {submissionState === 'success' ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => navigate(`/surveys/${surveyId}`)}
                >
                  Return to surveys
                </button>
              ) : (
                <button type="button" className="form-banner__dismiss" onClick={resetBanner}>
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SurveyForm;