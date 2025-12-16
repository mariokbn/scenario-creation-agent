import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Data will be stored locally only.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database schema helpers
export const saveScenario = async (scenarioData) => {
  if (!supabase) {
    // Fallback to localStorage if Supabase not configured
    const saved = JSON.parse(localStorage.getItem('scenarios') || '[]')
    saved.push({
      ...scenarioData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    })
    localStorage.setItem('scenarios', JSON.stringify(saved))
    return { data: saved[saved.length - 1], error: null }
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .insert([{
        name: scenarioData.name,
        data: scenarioData.data,
        metadata: scenarioData.metadata || {},
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error saving scenario:', error)
    return { data: null, error }
  }
}

export const getScenarios = async () => {
  if (!supabase) {
    // Fallback to localStorage
    const saved = JSON.parse(localStorage.getItem('scenarios') || '[]')
    return { data: saved, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return { data: [], error }
  }
}

export const deleteScenario = async (scenarioId) => {
  if (!supabase) {
    // Fallback to localStorage
    const saved = JSON.parse(localStorage.getItem('scenarios') || '[]')
    const filtered = saved.filter(s => s.id !== scenarioId)
    localStorage.setItem('scenarios', JSON.stringify(filtered))
    return { error: null }
  }

  try {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting scenario:', error)
    return { error }
  }
}

export const saveUploadSession = async (sessionData) => {
  if (!supabase) {
    localStorage.setItem('upload_session', JSON.stringify(sessionData))
    return { data: sessionData, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('upload_sessions')
      .insert([{
        csv_filename: sessionData.csvFilename,
        json_filename: sessionData.jsonFilename,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error saving upload session:', error)
    return { data: null, error }
  }
}
