const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

const getModel = () => {
  const client = getClient();
  return client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
};

/** Extracts the first valid JSON object found in a raw model response string. */
const extractJson = (text) => {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI response did not contain valid JSON');
  return JSON.parse(match[0]);
};

/**
 * 1. Auto complaint classification
 * Classifies a complaint's category, severity, sentiment, and suggests next action.
 */
const classifyComplaint = async ({ title, description, assetCategory }) => {
  const model = getModel();
  const prompt = `You are an AI assistant for an airport facilities management system (Airports Authority of India).
Analyze the following maintenance complaint and respond ONLY with a JSON object, no other text.

Complaint title: "${title}"
Complaint description: "${description}"
Related asset category: "${assetCategory || 'Unknown'}"

Return JSON with exactly these fields:
{
  "category": one of ["Mechanical", "Electrical", "Plumbing", "HVAC", "Safety Hazard", "IT/Networking", "Structural", "Cleanliness", "Other"],
  "severity": one of ["low", "medium", "high", "critical"],
  "sentiment": one of ["neutral", "frustrated", "urgent"],
  "summary": a one-sentence neutral summary of the issue (max 25 words),
  "suggestedAction": a short recommended first action for the maintenance team (max 25 words)
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return extractJson(text);
};

/**
 * 2. Predict maintenance priority
 * Scores an asset/maintenance request's priority based on criticality, complaint history, and age.
 */
const predictMaintenancePriority = async ({ assetName, category, criticality, issueDescription, lastMaintenanceDaysAgo, openComplaintsCount }) => {
  const model = getModel();
  const prompt = `You are an AI maintenance prioritization engine for airport infrastructure.
Given the following data, output ONLY a JSON object.

Asset: "${assetName}" (category: ${category}, criticality: ${criticality})
Issue: "${issueDescription}"
Days since last maintenance: ${lastMaintenanceDaysAgo ?? 'unknown'}
Number of currently open complaints linked to this asset: ${openComplaintsCount ?? 0}

Return JSON with exactly these fields:
{
  "priority": one of ["low", "medium", "high", "urgent"],
  "priorityScore": a number from 0-100 (100 = must fix immediately),
  "reasoning": a short explanation (max 30 words) of why this priority was assigned
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return extractJson(text);
};

/**
 * 3. Generate maintenance report (narrative summary of a period/asset for admins)
 */
const generateMaintenanceReport = async ({ periodLabel, stats, records }) => {
  const model = getModel();
  const prompt = `You are an AI reporting assistant for an airport asset management system.
Write a concise professional maintenance report summary (150-220 words) for "${periodLabel}".

Aggregate statistics:
${JSON.stringify(stats, null, 2)}

Sample of recent maintenance records:
${JSON.stringify(records?.slice(0, 15) ?? [], null, 2)}

Write in plain professional English suitable for airport operations leadership.
Structure: 1) Overview paragraph, 2) Key concerns/highlights, 3) Recommendations.
Do not use markdown headers, just well-organized paragraphs.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

/**
 * 4. Chat assistant for employees
 * Answers employee questions about assets/procedures using optional context data.
 */
const chatAssistant = async ({ message, history = [], contextData }) => {
  const model = getModel();

  const systemContext = `You are "AAI Assist", a helpful AI assistant embedded in the Airport Asset & Maintenance Management System used by airport staff.
You help employees with: how to log complaints, how to check asset status, maintenance procedures, understanding QR-coded assets, and general facility questions.
Be concise, professional, and airport-operations-appropriate. If asked something outside this system's scope, politely redirect.
${contextData ? `\nRelevant context data available to you:\n${JSON.stringify(contextData)}` : ''}`;

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Understood. I will assist airport staff accordingly.' }] },
      ...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
    ],
  });

  const result = await chat.sendMessage(message);
  return result.response.text().trim();
};

/**
 * 5. AI summary of asset history
 */
const summarizeAssetHistory = async ({ asset, maintenanceRecords, complaints }) => {
  const model = getModel();
  const prompt = `You are an AI assistant summarizing the lifecycle of an airport asset for a maintenance supervisor.

Asset details: ${JSON.stringify({
    name: asset.name,
    category: asset.category,
    status: asset.status,
    criticality: asset.criticality,
    purchaseDate: asset.purchaseDate,
    utilization: asset.utilization,
  })}

Maintenance history (${maintenanceRecords.length} records): ${JSON.stringify(maintenanceRecords.slice(0, 20))}

Complaint history (${complaints.length} records): ${JSON.stringify(complaints.slice(0, 20))}

Write a concise summary (100-150 words) covering: overall health trend, recurring issues (if any), and a recommendation
(e.g. continue routine maintenance / schedule inspection / consider replacement). Plain text, no markdown.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

module.exports = {
  classifyComplaint,
  predictMaintenancePriority,
  generateMaintenanceReport,
  chatAssistant,
  summarizeAssetHistory,
};
