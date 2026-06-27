const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY || '',
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`,
  'Content-Type': 'application/json'
};

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const request = async (path, options = {}) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const mapPatientFromDb = (row) => ({
  patientId: row.patient_id,
  name: row.name,
  affectedSide: row.affected_side,
  therapistEmail: row.therapist_email,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapSessionFromDb = (row) => ({
  sessionId: row.session_id,
  patientId: row.patient_id,
  date: row.assessment_date,
  gameMode: row.game_mode,
  metrics: row.metrics || {},
  rawLogs: row.raw_logs || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const upsertPatient = async (patient) => {
  const payload = {
    patient_id: patient.patientId,
    name: patient.name,
    affected_side: patient.affectedSide,
    therapist_email: patient.therapistEmail || 'therapist@neurodex.com'
  };

  const rows = await request('patients?on_conflict=patient_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload)
  });

  return mapPatientFromDb(rows[0]);
};

export const findPatient = async (patientId) => {
  const rows = await request(`patients?patient_id=eq.${encodeURIComponent(patientId)}&limit=1`);
  return rows[0] ? mapPatientFromDb(rows[0]) : null;
};

export const listPatients = async () => {
  const rows = await request('patients?select=*&order=created_at.desc');
  return rows.map(mapPatientFromDb);
};

export const saveSession = async (session) => {
  const payload = {
    session_id: session.sessionId,
    patient_id: session.patientId,
    assessment_date: session.date,
    game_mode: session.gameMode,
    metrics: session.metrics,
    raw_logs: session.rawLogs
  };

  const rows = await request('sessions?on_conflict=session_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload)
  });

  return mapSessionFromDb(rows[0]);
};

export const listSessions = async () => {
  const rows = await request('sessions?select=*&order=assessment_date.desc');
  return rows.map(mapSessionFromDb);
};

export const listSessionsByPatient = async (patientId) => {
  const rows = await request(`sessions?patient_id=eq.${encodeURIComponent(patientId)}&select=*&order=assessment_date.desc`);
  return rows.map(mapSessionFromDb);
};

export default {
  isSupabaseConfigured,
  upsertPatient,
  findPatient,
  listPatients,
  saveSession,
  listSessions,
  listSessionsByPatient
};
