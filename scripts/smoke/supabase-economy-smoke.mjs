import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const SMOKE_PREFIX = 'idol-null-smoke'
const INITIAL_POINTS = 500
const PREDICTION_AMOUNT = 25
const INFLUENCE_COST = 50

const binaryMarketTypes = new Set(['idol_played', 'anomaly_fires'])
const castawayMarketTypes = new Set(['daily_boot', 'season_winner', 'first_boot', 'first_consumed'])

const createdUsers = []
const checkNames = []

function loadDotEnv(filePath) {
  const absolutePath = resolve(process.cwd(), filePath)
  if (!existsSync(absolutePath)) return

  for (const rawLine of readFileSync(absolutePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue

    let value = rawValue.trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

function supabaseCli(args) {
  const env = { ...process.env }
  const npxCliPath = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')
  const binaries = process.platform === 'win32'
    ? [
        ['supabase.exe', args],
        ['supabase', args],
        ...(existsSync(npxCliPath) ? [[process.execPath, [npxCliPath, 'supabase', ...args]]] : []),
      ]
    : [['supabase', args], ['npx', ['supabase', ...args]]]

  let lastError
  for (const [command, commandArgs] of binaries) {
    try {
      return execFileSync(command, commandArgs, {
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

function normalizeKeys(payload) {
  const keys = Array.isArray(payload) ? payload : payload?.api_keys ?? payload?.keys ?? []
  const anon = keys.find((item) => item.name === 'anon' || item.role === 'anon' || item.key_type === 'anon')
  const service = keys.find((item) => (
    item.name === 'service_role' ||
    item.role === 'service_role' ||
    item.key_type === 'service_role'
  ))

  return {
    anonKey: anon?.api_key ?? anon?.apikey ?? anon?.key,
    serviceRoleKey: service?.api_key ?? service?.apikey ?? service?.key,
  }
}

async function fetchProjectKeys(projectRef, accessToken) {
  if (!projectRef) return {}

  if (accessToken) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.ok) {
      const payload = await response.json()
      const keys = normalizeKeys(payload)
      if (keys.anonKey && keys.serviceRoleKey) return keys
    }
  }

  const output = supabaseCli(['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json'])
  return normalizeKeys(JSON.parse(output))
}

async function resolveConfig() {
  loadDotEnv('.env.local')

  const projectRef = process.env.SUPABASE_PROJECT_REF
  let url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  let anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url && projectRef) {
    url = `https://${projectRef}.supabase.co`
  }

  if ((!anonKey || !serviceRoleKey) && projectRef) {
    const keys = await fetchProjectKeys(projectRef, process.env.SUPABASE_ACCESS_TOKEN)
    anonKey = anonKey || keys.anonKey
    serviceRoleKey = serviceRoleKey || keys.serviceRoleKey
  }

  const missing = [
    !url && 'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL',
    !anonKey && 'SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY or Supabase access token/project ref key lookup',
  ].filter(Boolean)

  if (missing.length) {
    throw new Error(`Missing Supabase smoke-test config: ${missing.join(', ')}`)
  }

  return {
    url: url.replace(/\/$/, ''),
    anonKey,
    serviceRoleKey,
  }
}

function headersFor(key, token = key) {
  return {
    apikey: key,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function describeError(response) {
  const data = response.data
  if (data && typeof data === 'object') {
    return data.message ?? data.error_description ?? data.error ?? JSON.stringify(data)
  }
  return response.text || `HTTP ${response.status}`
}

function check(condition, message, detail) {
  if (!condition) {
    throw new Error(detail ? `${message}: ${detail}` : message)
  }
  checkNames.push(message)
  console.log(`PASS ${message}`)
}

function requireOk(response, message) {
  check(response.ok, message, describeError(response))
}

function isOpenMarket(market, now = new Date()) {
  if (market.resolved_at) return false
  const closesAt = new Date(market.closes_at)
  return !Number.isNaN(closesAt.getTime()) && closesAt > now
}

function encodeFilter(value) {
  return encodeURIComponent(String(value))
}

function makeRequest(config) {
  return async function request(method, path, options = {}) {
    const response = await fetch(`${config.url}${path}`, {
      method,
      headers: options.headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })

    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      text,
    }
  }
}

async function createUser(request, config, label) {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const email = `${SMOKE_PREFIX}-${label}-${nonce}@example.com`
  const password = `Smoke-${nonce}-pass!`

  const response = await request('POST', '/auth/v1/admin/users', {
    headers: headersFor(config.serviceRoleKey),
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        source: 'ci-smoke',
        label,
      },
    },
  })
  requireOk(response, `created ${label} smoke user`)

  const user = {
    id: response.data?.id,
    email,
    password,
    label,
  }
  check(Boolean(user.id), `${label} smoke user returned an id`)
  createdUsers.push(user)
  return user
}

async function signIn(request, config, user) {
  const response = await request('POST', '/auth/v1/token?grant_type=password', {
    headers: headersFor(config.anonKey),
    body: {
      email: user.email,
      password: user.password,
    },
  })
  requireOk(response, `${user.label} smoke user can sign in`)
  check(Boolean(response.data?.access_token), `${user.label} smoke session returned a token`)
  return response.data.access_token
}

async function getRows(request, config, path, token = config.serviceRoleKey, key = config.serviceRoleKey) {
  const response = await request('GET', path, {
    headers: headersFor(key, token),
  })
  requireOk(response, `GET ${path}`)
  return Array.isArray(response.data) ? response.data : []
}

async function getProfile(request, config, userId) {
  const rows = await getRows(
    request,
    config,
    `/rest/v1/profiles?select=id,points&id=eq.${encodeFilter(userId)}`
  )
  check(rows.length === 1, `profile exists for ${userId}`)
  return rows[0]
}

async function getPredictionRows(request, config, userId) {
  return getRows(
    request,
    config,
    `/rest/v1/predictions?select=id,user_id,market_id,amount,choice_bool,castaway_id&user_id=eq.${encodeFilter(userId)}&order=id.asc`
  )
}

async function getInfluenceRows(request, config, userId) {
  return getRows(
    request,
    config,
    `/rest/v1/influence_actions?select=id,user_id,season_id,type,cost,status&user_id=eq.${encodeFilter(userId)}&order=id.asc`
  )
}

async function cleanup(request, config) {
  for (const user of [...createdUsers].reverse()) {
    const encodedUserId = encodeFilter(user.id)
    const cleanupRequests = [
      ['DELETE', `/rest/v1/influence_actions?user_id=eq.${encodedUserId}`],
      ['DELETE', `/rest/v1/predictions?user_id=eq.${encodedUserId}`],
      ['DELETE', `/rest/v1/profiles?id=eq.${encodedUserId}`],
      ['DELETE', `/auth/v1/admin/users/${encodeURIComponent(user.id)}`],
    ]

    for (const [method, path] of cleanupRequests) {
      try {
        const response = await request(method, path, {
          headers: {
            ...headersFor(config.serviceRoleKey),
            Prefer: 'return=minimal',
          },
        })
        if (!response.ok && response.status !== 404) {
          console.warn(`WARN cleanup ${method} ${path} failed: ${describeError(response)}`)
        }
      } catch (error) {
        console.warn(`WARN cleanup ${method} ${path} failed: ${error.message}`)
      }
    }
  }
}

async function run(config) {
  const request = makeRequest(config)

  const primaryUser = await createUser(request, config, 'primary')
  const otherUser = await createUser(request, config, 'other')
  const primaryToken = await signIn(request, config, primaryUser)
  const otherToken = await signIn(request, config, otherUser)

  const primaryProfile = await getProfile(request, config, primaryUser.id)
  const otherProfile = await getProfile(request, config, otherUser.id)
  check(primaryProfile.points === INITIAL_POINTS, 'primary smoke profile starts with 500 points')
  check(otherProfile.points === INITIAL_POINTS, 'other smoke profile starts with 500 points')

  const seasons = await getRows(
    request,
    config,
    '/rest/v1/seasons?select=id,season_number,status,current_day&status=eq.active&order=id.desc&limit=1'
  )
  check(seasons.length === 1, 'one active season is available for smoke validation')
  const season = seasons[0]

  const castaways = await getRows(
    request,
    config,
    `/rest/v1/castaways?select=id,name,status&season_id=eq.${season.id}&status=eq.alive&order=id.asc`
  )
  check(castaways.length >= 2, 'active season has at least two living castaways')
  const [firstCastaway, secondCastaway] = castaways

  const markets = await getRows(
    request,
    config,
    `/rest/v1/prediction_markets?select=id,type,label,season_id,closes_at,resolved_at&season_id=eq.${season.id}&resolved_at=is.null&order=day.asc.nullsfirst,id.asc`
  )
  const market = markets.find((candidate) => (
    isOpenMarket(candidate) &&
    (binaryMarketTypes.has(candidate.type) || castawayMarketTypes.has(candidate.type))
  ))
  check(Boolean(market), 'an open supported prediction market is available')

  const marketUsesBinaryChoice = binaryMarketTypes.has(market.type)
  const predictionPayload = {
    p_user_id: primaryUser.id,
    p_market_id: market.id,
    p_castaway_id: marketUsesBinaryChoice ? null : firstCastaway.id,
    p_choice_bool: marketUsesBinaryChoice ? true : null,
    p_amount: PREDICTION_AMOUNT,
    p_odds: 2.0,
  }

  const validPrediction = await request('POST', '/rest/v1/rpc/place_prediction_as_user', {
    headers: headersFor(config.serviceRoleKey),
    body: predictionPayload,
  })
  requireOk(validPrediction, 'service RPC accepts a valid prediction')
  check(validPrediction.data?.[0]?.remaining_points === INITIAL_POINTS - PREDICTION_AMOUNT, 'valid prediction returns remaining points')

  let updatedPrimaryProfile = await getProfile(request, config, primaryUser.id)
  check(updatedPrimaryProfile.points === INITIAL_POINTS - PREDICTION_AMOUNT, 'valid prediction deducts exactly 25 points')
  let primaryPredictions = await getPredictionRows(request, config, primaryUser.id)
  check(primaryPredictions.length === 1, 'valid prediction inserts exactly one prediction')
  const predictionId = primaryPredictions[0].id

  const duplicatePrediction = await request('POST', '/rest/v1/rpc/place_prediction_as_user', {
    headers: headersFor(config.serviceRoleKey),
    body: predictionPayload,
  })
  check(!duplicatePrediction.ok, 'duplicate prediction is rejected')
  updatedPrimaryProfile = await getProfile(request, config, primaryUser.id)
  primaryPredictions = await getPredictionRows(request, config, primaryUser.id)
  check(updatedPrimaryProfile.points === INITIAL_POINTS - PREDICTION_AMOUNT, 'duplicate prediction does not mutate points')
  check(primaryPredictions.length === 1, 'duplicate prediction does not insert a row')

  const insufficientPrediction = await request('POST', '/rest/v1/rpc/place_prediction_as_user', {
    headers: headersFor(config.serviceRoleKey),
    body: {
      ...predictionPayload,
      p_user_id: otherUser.id,
      p_amount: 999999,
    },
  })
  check(!insufficientPrediction.ok, 'insufficient-balance prediction is rejected')
  const unchangedOtherProfile = await getProfile(request, config, otherUser.id)
  const otherPredictions = await getPredictionRows(request, config, otherUser.id)
  check(unchangedOtherProfile.points === INITIAL_POINTS, 'insufficient prediction does not mutate points')
  check(otherPredictions.length === 0, 'insufficient prediction does not insert a row')

  const invalidUserRpc = await request('POST', '/rest/v1/rpc/place_prediction_as_user', {
    headers: headersFor(config.anonKey, primaryToken),
    body: {
      ...predictionPayload,
      p_market_id: market.id,
    },
  })
  check(!invalidUserRpc.ok, 'authenticated clients cannot execute service-only prediction RPC')

  const validInfluence = await request('POST', '/rest/v1/rpc/queue_influence_as_user', {
    headers: headersFor(config.serviceRoleKey),
    body: {
      p_user_id: primaryUser.id,
      p_season_id: season.id,
      p_type: 'confessional_leak',
      p_target_id: firstCastaway.id,
      p_target_b_id: null,
      p_cost: INFLUENCE_COST,
    },
  })
  requireOk(validInfluence, 'service RPC accepts a valid influence action')
  check(validInfluence.data?.[0]?.remaining_points === INITIAL_POINTS - PREDICTION_AMOUNT - INFLUENCE_COST, 'valid influence returns remaining points')

  updatedPrimaryProfile = await getProfile(request, config, primaryUser.id)
  check(updatedPrimaryProfile.points === INITIAL_POINTS - PREDICTION_AMOUNT - INFLUENCE_COST, 'valid influence deducts exactly 50 points')
  const primaryInfluenceRows = await getInfluenceRows(request, config, primaryUser.id)
  check(primaryInfluenceRows.length === 1, 'valid influence inserts exactly one action')
  const influenceId = primaryInfluenceRows[0].id

  const invalidInfluence = await request('POST', '/rest/v1/rpc/queue_influence_as_user', {
    headers: headersFor(config.serviceRoleKey),
    body: {
      p_user_id: otherUser.id,
      p_season_id: season.id,
      p_type: 'ghost_boost',
      p_target_id: firstCastaway.id,
      p_target_b_id: secondCastaway.id,
      p_cost: 200,
    },
  })
  check(!invalidInfluence.ok, 'invalid influence target is rejected')
  const otherInfluenceRows = await getInfluenceRows(request, config, otherUser.id)
  const otherAfterInvalidInfluence = await getProfile(request, config, otherUser.id)
  check(otherAfterInvalidInfluence.points === INITIAL_POINTS, 'invalid influence does not mutate points')
  check(otherInfluenceRows.length === 0, 'invalid influence does not insert a row')

  const directPointsUpdate = await request('PATCH', `/rest/v1/profiles?id=eq.${encodeFilter(primaryUser.id)}`, {
    headers: {
      ...headersFor(config.anonKey, primaryToken),
      Prefer: 'return=representation',
    },
    body: {
      points: 999999,
    },
  })
  check(!directPointsUpdate.ok, 'authenticated clients cannot directly update profile points')
  updatedPrimaryProfile = await getProfile(request, config, primaryUser.id)
  check(updatedPrimaryProfile.points === INITIAL_POINTS - PREDICTION_AMOUNT - INFLUENCE_COST, 'denied direct points update leaves points unchanged')

  const primaryVisiblePredictions = await getRows(
    request,
    config,
    `/rest/v1/predictions?select=id,user_id&id=eq.${predictionId}`,
    primaryToken,
    config.anonKey
  )
  const otherVisiblePredictions = await getRows(
    request,
    config,
    `/rest/v1/predictions?select=id,user_id&id=eq.${predictionId}`,
    otherToken,
    config.anonKey
  )
  check(primaryVisiblePredictions.length === 1, 'prediction RLS allows owner visibility')
  check(otherVisiblePredictions.length === 0, 'prediction RLS blocks non-owner visibility')

  const primaryVisibleInfluence = await getRows(
    request,
    config,
    `/rest/v1/influence_actions?select=id,user_id,status&id=eq.${influenceId}`,
    primaryToken,
    config.anonKey
  )
  const otherVisibleInfluence = await getRows(
    request,
    config,
    `/rest/v1/influence_actions?select=id,user_id,status&id=eq.${influenceId}`,
    otherToken,
    config.anonKey
  )
  check(primaryVisibleInfluence.length === 1, 'influence RLS allows owner visibility')
  check(otherVisibleInfluence.length === 0, 'pending influence RLS blocks non-owner visibility')

  console.log('')
  console.log('Supabase economy smoke PASS')
  console.log(`Season ${season.season_number}, day ${season.current_day}; market ${market.id} (${market.type}); ${checkNames.length} checks`)
}

let configForCleanup
try {
  configForCleanup = await resolveConfig()
  await run(configForCleanup)
} catch (error) {
  console.error('')
  console.error('Supabase economy smoke FAIL')
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (configForCleanup) {
    await cleanup(makeRequest(configForCleanup), configForCleanup)
  }
}
