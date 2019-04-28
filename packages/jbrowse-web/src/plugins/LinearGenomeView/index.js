import modelFactory from './models'
import ReactComponent from './components/LinearGenomeView'

import Plugin from '@gmod/jbrowse-core/Plugin'
import ViewType from '@gmod/jbrowse-core/pluggableElementTypes/ViewType'

import configSchema from './models/configSchema'
import BasicTrackFactory from './BasicTrack'
import DynamicTrackFactory from './DynamicTrack'
import TrackType from '@gmod/jbrowse-core/pluggableElementTypes/TrackType'

export default class LinearGenomeViewPlugin extends Plugin {
  install(pluginManager) {
    pluginManager.addTrackType(() => {
      const { stateModel, configSchema: trackConfig } = BasicTrackFactory(
        pluginManager,
      )

      return new TrackType({
        name: 'BasicTrack',
        configSchema: trackConfig,
        stateModel,
      })
    })

    pluginManager.addTrackType(() => {
      const { stateModel, configSchema: trackConfig } = DynamicTrackFactory(
        pluginManager,
      )

      return new TrackType({
        name: 'DynamicTrack',
        configSchema: trackConfig,
        stateModel,
      })
    })

    pluginManager.addViewType(() => {
      this.installed = true

      return new ViewType({
        name: 'LinearGenomeView',
        stateModel: modelFactory(pluginManager),
        configSchema,
        ReactComponent,
      })
    })
  }
}
