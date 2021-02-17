/* eslint-disable @typescript-eslint/no-explicit-any */
import { readConfObject } from '../configuration'

interface AnalyticsObj {
  [key: string]: any
}

interface Track {
  [key: string]: any
}

export async function writeAWSAnalytics(
  rootModel: any,
  initialTimeStamp: number,
  sessionQuery?: string | null,
) {
  const url =
    'https://mdvkjocq3e.execute-api.us-east-1.amazonaws.com/default/jbrowse-analytics'

  const multiAssemblyTracks = rootModel.jbrowse.tracks.filter(
    (track: any) => (readConfObject(track, 'assemblyNames') || []).length > 1,
  ).length

  const savedSessionCount = Object.keys(localStorage).filter(name =>
    name.includes('localSaved-'),
  ).length

  const { jbrowse: config, session, version: ver } = rootModel
  const { tracks, assemblies, plugins } = config

  // stats to be recorded in db
  const stats: AnalyticsObj = {
    ver,
    'plugins-count': plugins.length,
    'plugin-names': plugins.map((p: any) => p.name).join(','),
    'assemblies-count': assemblies.length,
    'tracks-count': tracks.length,
    'session-tracks-count': session?.sessionTracks.length || 0,
    'open-views': session?.views.length || 0,
    'synteny-tracks-count': multiAssemblyTracks,
    'saved-sessions-count': savedSessionCount,

    // field if existing session param in query before autogenerated param
    'existing-session-param-type': sessionQuery?.split('-')[0] || 'none',

    // screen geometry
    'scn-h': window.screen.height,
    'scn-w': window.screen.width,

    // window geometry
    'win-h': window.innerHeight,
    'win-w': window.innerWidth,

    electron: typeof window !== 'undefined' && Boolean(window.electron),
    loadTime: (Date.now() - initialTimeStamp) / 1000,
    jb2: true,
  }

  // stringifies the track type counts, gets processed in lambda
  tracks.forEach((track: Track) => {
    stats[`track-types-${track.type}`] =
      stats[`track-types-${track.type}`] + 1 || 1
  })

  // stringifies the session track type counts, gets processed in lambda
  session?.sessionTracks.forEach((track: Track) => {
    stats[`sessionTrack-types-${track.type}`] =
      stats[`sessionTrack-types-${track.type}`] + 1 || 1
  })

  // put stats into a query string for get request
  const qs = Object.keys(stats)
    .map(key => `${key}=${stats[key]}`)
    .join('&')

  return fetch(`${url}?${qs}`)
}

export async function writeGAAnalytics(
  rootModel: any,
  initialTimeStamp: number,
) {
  const jbrowseUser = 'UA-7115575-5'
  const stats: AnalyticsObj = {
    'tracks-count': rootModel.jbrowse.tracks.length, // this is all possible tracks
    ver: rootModel.version,
    electron: typeof window !== 'undefined' && Boolean(window.electron),
    loadTime: Date.now() - initialTimeStamp,
    pluginNames: rootModel.jbrowse.plugins.map(plugin => plugin.name),
  }

  // create script
  let analyticsScript =
    "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){"
  analyticsScript +=
    '(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),'
  analyticsScript +=
    'm=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)'
  analyticsScript +=
    "})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');"
  analyticsScript += `ga('create', '${jbrowseUser}', 'auto', 'jbrowseTracker');`

  const gaData: AnalyticsObj = {}
  const googleDimensions = 'tracks-count ver electron loadTime pluginNames'

  googleDimensions.split(/\s+/).forEach((key, index) => {
    gaData[`dimension${index + 1}`] = stats[key]
  })

  gaData.metric1 = Math.round(stats.loadTime)

  analyticsScript += `ga('jbrowseTracker.send', 'pageview',${JSON.stringify(
    gaData,
  )});`

  const analyticsScriptNode = document.createElement('script')
  analyticsScriptNode.innerHTML = analyticsScript

  document.getElementsByTagName('head')[0].appendChild(analyticsScriptNode)
}
