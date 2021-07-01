import { ConfigurationSchema } from '@jbrowse/core/configuration'
import { types, Instance } from 'mobx-state-tree'
import PluginManager from '@jbrowse/core/PluginManager'
import { createInternetAccountConfig } from '@jbrowse/core/pluggableElementTypes/models'

function ExternalTokenConfigFactory(pluginManager: PluginManager) {
  return ConfigurationSchema(
    'ExternalTokenInternetAccount',
    {
      validDomains: {
        description:
          'array of valid domains the url can contain to use this account. Empty = all domains',
        type: 'stringArray',
        defaultValue: [],
      },
    },
    {
      baseConfiguration: createInternetAccountConfig(pluginManager),
      explicitlyTyped: true,
    },
  )
}

export type ExternalTokenInternetAccountConfigModel = ReturnType<
  typeof ExternalTokenConfigFactory
>
export type OAuthInternetAccountConfig = Instance<
  ExternalTokenInternetAccountConfigModel
>
export default ExternalTokenConfigFactory
