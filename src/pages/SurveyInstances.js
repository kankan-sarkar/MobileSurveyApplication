import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const SurveyInstances = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [template, setTemplate] = useState(null);

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
    const zip = new JSZip();
    const results = [];
    const attachmentsFolder = zip.folder('attachments');

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
    saveAs(content, `${template.title}-export.zip`);
  };

  return (
    <div>
      {template && <h1>{template.title} - Instances</h1>}
      <button onClick={() => navigate('/')}>Back to Dashboard</button>
      <button onClick={handleCreate}>New Instance</button>
      <button onClick={handleExport}>Export All</button>
      <ul>
        {instances.map((instance) => (
          <li key={instance.instanceId}>
            <span>Instance created at: {new Date(instance.createdAt).toLocaleString()}</span>
            <button onClick={() => navigate(`/surveys/${surveyId}/instances/${instance.instanceId}`)}>Edit</button>
            <button onClick={() => handleDelete(instance.instanceId)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SurveyInstances;