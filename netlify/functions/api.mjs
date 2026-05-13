import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { calculateRiasecScore } from '../../src/services/riasecScoring.js';

const FRONTEND_ORIGIN = 'https://illustrious-capybara-05325f.netlify.app';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getSupabase() {
  const url = Netlify.env.get('VITE_SUPABASE_URL') || Netlify.env.get('SUPABASE_URL');
  const key = Netlify.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') || Netlify.env.get('SUPABASE_ANON_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function getJwtSecret() {
  return Netlify.env.get('JWT_SECRET') || 'fallback_secret_key';
}

function verifyAuth(req) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

async function handleAssessmentStart(req, supabase) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      nama: body.nama,
      usia: body.usia,
      jenis_kelamin: body.jenisKelamin,
      alamat: body.alamat,
      status_perkawinan: body.statusPerkawinan,
      dukungan_keluarga: body.dukunganKeluarga,
      tanggungan: body.tanggungan,
      pendidikan_terakhir: body.pendidikanTerakhir,
    })
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 400);
  return jsonResponse({ clientId: data.id }, 201);
}

async function handleAssessmentSubmit(req, supabase) {
  const { clientId, answers, attentionCheck } = await req.json();

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError || !client) return jsonResponse({ error: 'Client not found' }, 404);

  const attentionCheckPassed = attentionCheck === false || attentionCheck === 'Tidak';
  const scoringResult = calculateRiasecScore(answers);

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      client_id: clientId,
      answers,
      attention_check_passed: attentionCheckPassed,
      is_valid: attentionCheckPassed,
      raw_scores: scoringResult.rawScores,
      normalized_scores: scoringResult.normalizedScores,
      categories: scoringResult.categories,
      ranked_profile: scoringResult.rankedProfile,
      top3: scoringResult.top3,
      bottom3: scoringResult.bottom3,
    })
    .select()
    .single();

  if (assessmentError) return jsonResponse({ error: assessmentError.message }, 400);

  return jsonResponse({
    assessmentId: assessment.id,
    top3: assessment.top3,
    bottom3: assessment.bottom3,
    rankedProfile: assessment.ranked_profile,
    isValid: assessment.is_valid,
  }, 201);
}

async function handleAssessmentValidate(req, supabase) {
  const { assessmentId, persepsiSesuai, persepsiTidakSesuai, pekerjaanDisenangi, pekerjaanDikuasai } = await req.json();

  const { data: assessment, error } = await supabase
    .from('assessments')
    .update({
      persepsi_sesuai: persepsiSesuai,
      persepsi_tidak_sesuai: persepsiTidakSesuai,
      pekerjaan_disenangi: pekerjaanDisenangi,
      pekerjaan_dikuasai: pekerjaanDikuasai,
      completed_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 400);
  if (!assessment) return jsonResponse({ error: 'Assessment not found' }, 404);

  return jsonResponse(assessment);
}

async function handleAssessmentResult(assessmentId, supabase) {
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('*, clients(*)')
    .eq('id', assessmentId)
    .single();

  if (error) return jsonResponse({ error: error.message }, 400);
  if (!assessment) return jsonResponse({ error: 'Assessment not found' }, 404);

  return jsonResponse(assessment);
}

async function handleAdminLogin(req, supabase) {
  const { username, password } = await req.json();

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !admin) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return jsonResponse({ error: 'Invalid credentials' }, 401);

  const token = jwt.sign(
    { id: admin.id, role: admin.role },
    getJwtSecret(),
    { expiresIn: '1d' }
  );
  return jsonResponse({
    token,
    admin: { username: admin.username, nama: admin.nama, role: admin.role },
  });
}

async function handleAdminClients(supabase) {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*, assessments(*)')
    .order('created_at', { ascending: false });

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse(clients);
}

async function handleAdminClientDetail(clientId, supabase) {
  const { data: client, error } = await supabase
    .from('clients')
    .select('*, assessments(*)')
    .eq('id', clientId)
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!client) return jsonResponse({ error: 'Client not found' }, 404);

  const assessment = client.assessments?.length > 0 ? client.assessments[0] : null;
  const responseData = assessment
    ? { ...assessment, clients: client }
    : {
        clients: client,
        answers: {},
        raw_scores: {},
        normalized_scores: {},
        categories: {},
        top3: [],
        bottom3: [],
        attention_check_passed: false,
        is_valid: false,
        persepsi_sesuai: null,
        persepsi_tidak_sesuai: null,
        pekerjaan_disenangi: [],
        pekerjaan_dikuasai: [],
      };

  return jsonResponse(responseData);
}

async function handleAdminStats(supabase) {
  const { count: totalClients, error: clientError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  const { count: completedAssessments, error: assessmentError } = await supabase
    .from('assessments')
    .select('*', { count: 'exact', head: true })
    .not('completed_at', 'is', null);

  if (clientError) return jsonResponse({ error: clientError.message }, 500);
  if (assessmentError) return jsonResponse({ error: assessmentError.message }, 500);

  return jsonResponse({
    totalClients: totalClients || 0,
    completedAssessments: completedAssessments || 0,
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (path === '/health') {
      return jsonResponse({ status: 'ok', message: 'Platform ARAH API is running' });
    }

    const supabase = getSupabase();

    // Assessment routes
    if (path === '/api/assessment/start' && method === 'POST') {
      return await handleAssessmentStart(req, supabase);
    }
    if (path === '/api/assessment/submit' && method === 'POST') {
      return await handleAssessmentSubmit(req, supabase);
    }
    if (path === '/api/assessment/validate' && method === 'POST') {
      return await handleAssessmentValidate(req, supabase);
    }
    const resultMatch = path.match(/^\/api\/assessment\/result\/(.+)$/);
    if (resultMatch && method === 'GET') {
      return await handleAssessmentResult(resultMatch[1], supabase);
    }

    // Admin login (public)
    if (path === '/api/admin/login' && method === 'POST') {
      return await handleAdminLogin(req, supabase);
    }

    // Protected admin routes
    const adminUser = verifyAuth(req);
    if (!adminUser) return jsonResponse({ error: 'Access denied' }, 401);

    if (path === '/api/admin/clients' && method === 'GET') {
      return await handleAdminClients(supabase);
    }
    if (path === '/api/admin/stats' && method === 'GET') {
      return await handleAdminStats(supabase);
    }
    const clientMatch = path.match(/^\/api\/admin\/clients\/(.+)$/);
    if (clientMatch && method === 'GET') {
      return await handleAdminClientDetail(clientMatch[1], supabase);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
};

export const config = {
  path: ['/api/*', '/health'],
};
