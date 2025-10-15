import Dexie from 'dexie';

export const db = new Dexie('MobileSurveyApplication');

db.version(1).stores({
  surveyTemplates: 'id, title, version', // Primary key and indexed props
  surveyInstances: '++instanceId, surveyId, createdAt', // Auto-incrementing primary key and indexed props
});