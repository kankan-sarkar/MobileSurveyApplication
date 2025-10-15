import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db/db';

const SurveyForm = () => {
  const { surveyId, instanceId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [instance, setInstance] = useState(null);
  const [answers, setAnswers] = useState({});

  const fetchInstanceData = useCallback(async () => {
    const tpl = await db.surveyTemplates.get(surveyId);
    const inst = await db.surveyInstances.get(parseInt(instanceId));
    setTemplate(tpl);
    setInstance(inst);
    setAnswers(inst.answers || {});
  }, [surveyId, instanceId]);

  useEffect(() => {
    fetchInstanceData();
  }, [fetchInstanceData]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleFileChange = async (questionId, file) => {
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
      navigator.geolocation.getCurrentPosition((position) => {
        handleAnswerChange(questionId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSave = async () => {
    await db.surveyInstances.update(parseInt(instanceId), { answers });
    alert('Survey saved!');
  };

  if (!template || !instance) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{template.title}</h1>
      <form>
        {template.sections.map((section) => (
          <div key={section.id}>
            <h2>{section.title}</h2>
            {section.questions.map((q) => (
              <div key={q.id}>
                <label htmlFor={q.id}>{q.label}</label>
                {q.type === 'textbox' && (
                  <textarea
                    id={q.id}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                )}
                {q.type === 'dropdown' && (
                  <select
                    id={q.id}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {q.type === 'camera' && (
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileChange(q.id, e.target.files[0])}
                  />
                )}
                {q.type === 'attachment' && (
                  <input
                    type="file"
                    accept={q.accept}
                    onChange={(e) => handleFileChange(q.id, e.target.files[0])}
                  />
                )}
                {q.type === 'location' && (
                  <button type="button" onClick={() => handleLocation(q.id)}>
                    Get Location
                  </button>
                )}
                {answers[q.id] && q.type === 'location' && (
                  <span>
                    Lat: {answers[q.id].latitude}, Lon: {answers[q.id].longitude}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </form>
      <button onClick={handleSave}>Save</button>
      <button onClick={() => navigate(`/surveys/${surveyId}`)}>Cancel</button>
    </div>
  );
};

export default SurveyForm;