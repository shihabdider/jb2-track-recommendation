// will move later, just putting here tempimport React from 'react'
import { ConfigurationReference } from '@jbrowse/core/configuration'
import { InternetAccount } from '@jbrowse/core/pluggableElementTypes/models'
import PluginManager from '@jbrowse/core/PluginManager'
import { OAuthInternetAccountConfigModel } from './configSchema'
import crypto from 'crypto'
import { Instance, types } from 'mobx-state-tree'

// Notes go here:

// if chooser is first,
// put a menu item to open dropbox or open google drive
// similar to igv where the menu item action is that it opens the chooser
// and the user selects a file, where that file will be put into the track selector
// or maybe in the 'Add track' flow, add an option for add from dropbox/google drive
// or maybe its just part of the file selector flow (such as import form or sv inspector import form)

// make a new core plugin called authentication
// put OAuthModel file there, plugin would have implementation of Oauth, HTTPBasic, etc

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
  token_access_type?: string
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
        refreshToken: '',
        codeVerifierPKCE: '',
        expireTime: 0,
      }))
      // handleslocation will have to look at config and see what domain it's pointing at
      // i.e if google drive oauth, handlesLocation looks at self.config.endpoint and see if it is the associated endpoint
      // if above returns true then do the oauth flow as openLocation to get the correct headers
      .views(self => ({
        handlesLocation(location?: Location): boolean {
          // this will probably look at something in the config which indicates that it is an OAuth pathway,
          // also look at location, if location is set to need authentication it would reutrn true
          const validDomains = self.accountConfig.validDomains || []
          return validDomains.some((domain: string) =>
            location?.href.includes(domain),
          )
        },
      }))
      .actions(self => ({
        setCodeVerifierPKCE(codeVerifier: string) {
          self.codeVerifierPKCE = codeVerifier
        },
        async useEndpointForAuthorization() {
          self.setSelected(true)
          const data: OAuthData = {
            client_id: self.accountConfig.clientId,
            redirect_uri: 'http://localhost:3000',
            response_type: self.accountConfig.responseType || 'code',
          }

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

          if (self.accountConfig.hasRefreshToken) {
            data.token_access_type = 'offline'
          }

          const params = Object.entries(data)
            .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
            .join('&')

          const url = `${self.accountConfig.authEndpoint}?${params}`
          const options = `width=500,height=600,left=0,top=0`
          return window.open(url, 'Authorization', options)
        },
        async fetchFile(location: string, existingToken?: string) {
          const accessToken = existingToken ? existingToken : self.accessToken
          if (!location || !accessToken) {
            return
          }
          switch (self.accountConfig.internetAccountId) {
            case 'dropboxOAuth': {
              const response = await fetch(
                'https://api.dropboxapi.com/2/sharing/get_shared_link_metadata',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
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
                      Authorization: `Bearer ${accessToken}`,
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
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                },
              )

              const fileMetadata = await response.json()
              return fileMetadata.downloadUrl
            }
          }
        },
      }))
      .actions(self => {
        let location: Location | undefined = undefined
        let resolve: Function | undefined = undefined
        return {
          async setAccessTokenInfo(
            token: string,
            expireTime = 0,
            generateNew = false,
          ) {
            self.accessToken = token
            self.expireTime = expireTime

            const tokenExpirationFromNow = Date.now() + expireTime * 1000
            if (generateNew) {
              sessionStorage.setItem(
                `${self.accountConfig.internetAccountId}-token-${tokenExpirationFromNow}`,
                token,
              )
            }

            const fileUrl = await self.fetchFile((location as Location).href)
            // @ts-ignore
            resolve(fileUrl)
            resolve = undefined
            location = undefined
          },
          async openLocation(l: Location) {
            location = l
            return new Promise(async r => {
              let hasStoredToken = false

              for (const key of Object.keys(sessionStorage)) {
                if (key.startsWith(self.accountConfig.internetAccountId)) {
                  const tokenExpirationTime = parseFloat(key.split('-')[2])
                  if (tokenExpirationTime >= Date.now()) {
                    resolve = r
                    await this.setAccessTokenInfo(
                      sessionStorage.getItem(key) as string,
                    )
                    hasStoredToken = true
                  } else {
                    sessionStorage.removeItem(key)
                    hasStoredToken = false
                  }
                }
              }

              if (!hasStoredToken) {
                self.useEndpointForAuthorization()
                resolve = r
              }
            })
          },
        }
      })
      .actions(self => ({
        setAuthorizationCode(code: string) {
          self.authorizationCode = code
        },
        setRefreshToken(token: string) {
          const refreshTokenKey = `${self.accountConfig.internetAccountId}-refreshToken`
          const existingToken = localStorage.getItem(refreshTokenKey)
          if (!existingToken) {
            self.refreshToken = token
            localStorage.setItem(
              `${self.accountConfig.internetAccountId}-refreshToken`,
              token,
            )
          } else {
            self.refreshToken = existingToken
          }
        },
        // setAccessTokenInfo(token: string, expireTime = 0, generateNew = false) {
        //   self.accessToken = token
        //   self.expireTime = expireTime

        //   const tokenExpirationFromNow = Date.now() + expireTime * 1000
        //   if (generateNew) {
        //     sessionStorage.setItem(
        //       `${self.accountConfig.internetAccountId}-token-${tokenExpirationFromNow}`,
        //       token,
        //     )
        //   }

        //   self.setCurrentTypeAuthorizing('')
        // },
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
            self.setAccessTokenInfo(
              accessToken.access_token,
              accessToken.expires_in,
              true,
            )
            if (accessToken.refresh_token) {
              this.setRefreshToken(accessToken.refresh_token)
            }
          }
        },
        async exchangeRefreshForAccessToken() {
          const foundRefreshToken = Object.keys(localStorage).find(key => {
            return (
              key === `${self.accountConfig.internetAccountId}-refreshToken`
            )
          })
          if (foundRefreshToken && self.accountConfig) {
            const data = {
              grant_type: 'refresh_token',
              refresh_token: foundRefreshToken,
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
            self.setAccessTokenInfo(
              accessToken.access_token,
              accessToken.expires_in,
              true,
            )
          }
        },
        // async openLocation(location: Location) {
        //   return new Promise(resolve => {
        //     this.useEndpointForAuthorization()
        //     resolve(
        //       openLocation({
        //         uri: 'https://example.com',
        //         authHeader: 'Authorization',
        //         authTokenReference: self.accessToken,
        //       }),
        //     )
        //   })
        // },
        // ideally it would be:
        // something calls the rootmodel's open location
        // rootmodel chooses open location from one of the internet accoutns, say its this open location
        // then:
        // return a promise from openLocation like return new Promise(resolve => {
        //   authStuff(resolve)
        // })
        // resolve(utilOpenLocation({uri: 'something', /* other stuff */}))
        // auth stuff is starting the auth workflow
        // once auth stuff is done, call resolve on the promise with the file handle
        // call util openLocation with authHeader, authToken and reutnr that
        // start auth workflow
        // the workflow waits on a promise to resolve

        // check src/apollofetch.tsx
      }))
  )
}
// will probably add an aftercreate that checks sessionStorage for existence of a valid token that is still working,
// if so use that as the token and mark yourself logged in

export default stateModelFactory
export type AlignmentsDisplayStateModel = ReturnType<typeof stateModelFactory>
export type AlignmentsDisplayModel = Instance<AlignmentsDisplayStateModel>
