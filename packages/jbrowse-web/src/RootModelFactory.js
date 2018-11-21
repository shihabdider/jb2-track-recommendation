import { types } from 'mobx-state-tree'
import { ConfigurationSchema } from './configuration'

const isPresent = thing => !!thing

function extractAll(fieldName, typesList) {
  return typesList.map(definition => definition[fieldName]).filter(isPresent)
}

export default function(pluginManager) {
  // const viewConfigTypes = Object.fromEntries(
  //   Object.entries(viewTypes).map(([typeName,typeObject]) => [typeName, typeObject.]
  //   })
  // Object.entries(viewTypes).forEach(([typeName,typeObject]) => {
  //   viewConfigTypes
  // })
  // TODO: get all config schemas from the view types and make an object of them
  const viewConfigTypes = {}

  const RootModel = types
    .model('JBrowseWebRootModel', {
      browser: types.frozen(this),
      views: types.array(
        types.union(
          ...extractAll(
            'stateModel',
            pluginManager.getElementTypesInGroup('view'),
          ),
        ),
      ),
      tracks: types.array(
        types.union(
          ...extractAll(
            'stateModel',
            pluginManager.getElementTypesInGroup('track'),
          ),
        ),
      ),
      drawerWidgets: types.array(
        types.union(
          ...extractAll(
            'stateModel',
            pluginManager.getElementTypesInGroup('drawer widget'),
          ),
        ),
      ),
      configuration: ConfigurationSchema('JBrowseWebRoot', {
        views: types.array(
          types.union(
            ...extractAll(
              'configSchema',
              pluginManager.getElementTypesInGroup('view'),
            ),
          ),
        ),
        tracks: types.array(
          types.union(
            ...extractAll(
              'configSchema',
              pluginManager.getElementTypesInGroup('track'),
            ),
          ),
        ),
      }),
    })
    .volatile(self => ({
      pluginManager,
    }))
    .actions(self => ({
      addView(typeName, initialState = {}, configuration = { type: typeName }) {
        const typeDefinition = pluginManager.getElementType('view', typeName)
        if (!typeDefinition) throw new Error(`unknown view type ${typeName}`)
        const data = Object.assign({}, initialState, {
          type: typeName,
          configuration,
        })
        self.views.push(typeDefinition.stateModel.create(data))
      },
      addDrawerWidget(
        typeName,
        initialState = {},
        configuration = { type: typeName },
      ) {
        const typeDefinition = pluginManager.getElementType(
          'drawer widget',
          typeName,
        )
        if (!typeDefinition)
          throw new Error(`unknown drawer widget type ${typeName}`)
        const data = Object.assign({}, initialState, {
          type: typeName,
          configuration,
        })
        self.drawerWidgets.push(typeDefinition.stateModel.create(data))
      },
    }))
  return RootModel
}

// a track is a combination of a dataset and a renderer, along with some conditions
// specifying in which contexts it is available (which assemblies, which views, etc)
