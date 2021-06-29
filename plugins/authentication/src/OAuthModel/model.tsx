// will move later, just putting here tempimport React from 'react'
import {
  ConfigurationReference,
  getConf,
  readConfObject,
} from '@jbrowse/core/configuration'
import { getRoot } from 'mobx-state-tree'
import { AnyConfigurationModel } from '@jbrowse/core/configuration/configurationSchema'
import { InternetAccount } from '@jbrowse/core/pluggableElementTypes/models'
import PluginManager from '@jbrowse/core/PluginManager'
import { OAuthInternetAccountConfigModel } from './configSchema'
import crypto from 'crypto'
import { addDisposer, getSnapshot, Instance, types } from 'mobx-state-tree'

// Notes go here:
// instead of laying out the abstractions first,
// just create a menu item that is 'Open Dropbox'
// and have the onclick handle all the the oauth logic
// to get the access_token to see what abstractions we would need

// can authorize and get access token
// adding track to session is technically adding wrong link, it is adding a share link
// while to access the track contents, it must fetch with the Bearer access token and get a temporary link
// which can be used to load

// if chooser is first,
// put a menu item to open dropbox or open google drive
// similar to igv where the menu item action is that it opens the chooser
// and the user selects a file, where that file will be put into the track selector
// or maybe in the 'Add track' flow, add an option for add from dropbox/google drive
// or maybe its just part of the file selector flow (such as import form or sv inspector import form)

// make a new core plugin called authentication
// put OAuthModel file there, plugin would have implementation of Oauth, HTTPBasic, etc
// need to edit the current openLocation, move it to action on rootModel
// new openLocation: check if any of the handleLocations return true, then call that openLocation

interface Account {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface OAuthData {
  client_id: string
  redirect_uri: string
  response_type: 'token' | 'code'
  scope?: string
  code_challenge?: string
  code_challenge_method?: string
}

const stateModelFactory = (
  pluginManager: PluginManager,
  configSchema: OAuthInternetAccountConfigModel,
) => {
  return (
    types
      .compose(
        'OAuthInternetAccount',
        InternetAccount,
        types.model({
          id: 'OAuth',
          type: types.literal('OAuthInternetAccount'),
          configuration: ConfigurationReference(configSchema),
        }),
      )
      .volatile(() => ({
        authorizationCode: '',
        accessToken: '',
        currentTypeAuthorizing: '',
        codeVerifierPKCE: '',
        selected: false,
      }))
      // handleslocation will have to look at config and see what domain it's pointing at
      // i.e if google drive oauth, handlesLocation looks at self.config.endpoint and see if it is the associated endpoint
      // if above returns true then do the oauth flow as openLocation to get the correct headers
      .views(self => ({
        handlesLocation(location?: Location): boolean {
          // this will probably look at something in the config which indicates that it is an OAuth pathway,
          // also look at location, if location is set to need authentication it would reutrn true
          const accountConfig = readConfObject(self.configuration)
          const validDomains = accountConfig.validDomains
          return (
            // accountConfig.needsAuthorization &&
            validDomains.length === 0 ||
            validDomains.some((domain: string) =>
              location?.href.includes(domain),
            )
          )
        },

        get accountConfig() {
          return readConfObject(self.configuration)
        },
      }))
      .actions(self => ({
        async fetchFile(location: string) {
          if (!location || !self.accessToken) {
            return
          }
          switch (self.accountConfig.internetAccountId) {
            case 'dropboxOAuth': {
              const response = await fetch(
                'https://api.dropboxapi.com/2/sharing/get_shared_link_metadata',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${self.accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    url: location,
                  }),
                },
              )
              if (!response.ok) {
                const errorText = await response.text()
                return { error: errorText }
              }
              const metadata = await response.json()
              if (metadata) {
                const fileResponse = await fetch(
                  'https://api.dropboxapi.com/2/files/get_temporary_link',
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${self.accessToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ path: metadata.id }),
                  },
                )
                if (!fileResponse.ok) {
                  const errorText = await fileResponse.text()
                  return { error: errorText }
                }
                const file = await fileResponse.json()
                return file.link
              }
              break
            }
            case 'googleOAuth': {
              const urlId = location.match(/[-\w]{25,}/)

              const response = await fetch(
                `https://www.googleapis.com/drive/v2/files/${urlId}`,
                {
                  headers: {
                    Authorization: `Bearer ${self.accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                },
              )

              const fileMetadata = await response.json()
              return fileMetadata.downloadUrl
            }
          }
        },
        async useEndpointForAuthorization() {
          const data: OAuthData = {
            client_id: self.accountConfig.clientId,
            redirect_uri: 'http://localhost:3000',
            response_type: self.accountConfig.responseType || 'code',
          }

          this.setCurrentTypeAuthorizing(self.accountConfig.internetAccountId)

          if (self.accountConfig.scopes) {
            data.scope = self.accountConfig.scopes
          }

          if (self.accountConfig.needsPKCE) {
            const base64Encode = (buf: Buffer) => {
              return buf
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')
            }
            const codeVerifier = base64Encode(crypto.randomBytes(32))
            const sha256 = (str: string) => {
              return crypto.createHash('sha256').update(str).digest()
            }
            const codeChallenge = base64Encode(sha256(codeVerifier))
            data.code_challenge = codeChallenge
            data.code_challenge_method = 'S256'

            this.setCodeVerifierPKCE(codeVerifier)
          }

          const params = Object.entries(data)
            .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
            .join('&')

          const url = `${self.accountConfig.authEndpoint}?${params}`
          const options = `width=500,height=600,left=0,top=0`
          return window.open(url, 'Authorization', options)
        },
        setAuthorizationCode(code: string) {
          self.authorizationCode = code
        },
        setCurrentTypeAuthorizing(type: string) {
          self.currentTypeAuthorizing = type
        },
        setCodeVerifierPKCE(codeVerifier: string) {
          self.codeVerifierPKCE = codeVerifier
        },
        setSelected(bool: boolean) {
          self.selected = bool
        },
        setAccessToken(token: string) {
          self.accessToken = token
          this.setCurrentTypeAuthorizing('')

          console.log(token)
        },
        async exchangeAuthorizationForAccessToken(token: string) {
          if (self.accountConfig) {
            const data = {
              code: token,
              grant_type: 'authorization_code',
              client_id: self.accountConfig.clientId,
              code_verifier: self.codeVerifierPKCE,
              redirect_uri: 'http://localhost:3000',
            }

            const params = Object.entries(data)
              .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
              .join('&')

            const response = await fetch(
              `${self.accountConfig.tokenEndpoint}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
              },
            )

            const accessToken = await response.json()
            this.setAccessToken(accessToken.access_token)
            sessionStorage.setItem(
              `${self.accountConfig.internetAccountId}-token`,
              accessToken.access_token,
            )
          }
        },
        async openLocation(location: Location) {
          const startFlow = await this.useEndpointForAuthorization()
          return startFlow
        },
      }))
  )
}
// will probably add an aftercreate that checks sessionStorage for existence of a valid token that is still working,
// if so use that as the token and mark yourself logged in

export default stateModelFactory
export type AlignmentsDisplayStateModel = ReturnType<typeof stateModelFactory>
export type AlignmentsDisplayModel = Instance<AlignmentsDisplayStateModel>
