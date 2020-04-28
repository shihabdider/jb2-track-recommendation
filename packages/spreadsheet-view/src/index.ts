import { AbstractViewContainer } from '@gmod/jbrowse-core/util'
import PluginManager from '@gmod/jbrowse-core/PluginManager'
import Plugin from '@gmod/jbrowse-core/Plugin'

export default class SpreadsheetViewPlugin extends Plugin {
  install(pluginManager: PluginManager) {
    pluginManager.addViewType(() =>
      pluginManager.jbrequire(require('./SpreadsheetView/SpreadsheetViewType')),
    )
  }

  configure(pluginManager: PluginManager) {
    if (pluginManager.rootModel && pluginManager.rootModel.menus) {
      pluginManager.rootModel.appendToSubMenu(['File', 'Add'], {
        label: 'Tabular data',
        icon: 'view_comfy',
        onClick: (session: AbstractViewContainer) => {
          session.addView('SpreadsheetView', {})
        },
      })
    }
  }
}
