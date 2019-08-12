import {
  ConfigurationReference,
  getConf,
} from '@gmod/jbrowse-core/configuration'
import { getSession } from '@gmod/jbrowse-core/util'
import { getParentRenderProps } from '@gmod/jbrowse-core/util/tracks'
import {
  BlockBasedTrack,
  blockBasedTrackModel,
} from '@gmod/jbrowse-plugin-linear-genome-view'
import { types } from 'mobx-state-tree'
import TrackControls from '../components/TrackControls'

// using a map because it preserves order
const rendererTypes = new Map([
  ['pileup', 'PileupRenderer'],
  ['svg', 'SvgFeatureRenderer'],
])

export default (pluginManager, configSchema) =>
  types.compose(
    'AlignmentsTrack',
    blockBasedTrackModel,
    types
      .model({
        type: types.literal('AlignmentsTrack'),
        configuration: ConfigurationReference(configSchema),
        // the renderer that the user has selected in the UI, empty string
        // if they have not made any selection
        selectedRendering: types.optional(types.string, ''),
      })
      .volatile(() => ({
        reactComponent: BlockBasedTrack,
        rendererTypeChoices: Array.from(rendererTypes.keys()),
      }))
      .actions(self => ({
        selectFeature(feature) {
          const session = getSession(self)
          // TODO: we shouldn't need to have to get this deep into knowing about
          // drawer widgets here, the drawer widget should be a reaction to
          // setting a selected feature...right???
          if (session.drawerWidgets) {
            const featureWidget = session.addDrawerWidget(
              'AlignmentsFeatureDrawerWidget',
              'alignmentsFeature',
              { featureData: feature.data },
            )
            session.showDrawerWidget(featureWidget)
          }
          session.setSelection(feature)
        },
        clearFeatureSelection() {
          const session = getSession(self)
          session.clearSelection()
        },
        setRenderer(newRenderer) {
          self.selectedRendering = newRenderer
        },
      }))
      .views(self => ({
        /**
         * the renderer type name is based on the "view"
         * selected in the UI: pileup, coverage, etc
         */
        get rendererTypeName() {
          const defaultRendering = getConf(self, 'defaultRendering')
          const viewName = self.selectedRendering || defaultRendering
          const rendererType = rendererTypes.get(viewName)
          if (!rendererType)
            throw new Error(`unknown alignments view name ${viewName}`)
          return rendererType
        },

        get ControlsComponent() {
          return TrackControls
        },

        /**
         * returns a string feature ID if the globally-selected object
         * is probably a feature
         */
        get selectedFeatureId() {
          const session = getSession(self)
          if (!session) return undefined
          const { selection } = session
          // does it quack like a feature?
          if (
            selection &&
            typeof selection.get === 'function' &&
            typeof selection.id === 'function'
          ) {
            // probably is a feature
            return selection.id()
          }
          return undefined
        },

        /**
         * the react props that are passed to the Renderer when data
         * is rendered in this track
         */
        get renderProps() {
          // view -> [tracks] -> [blocks]
          const config = self.rendererType.configSchema.create(
            getConf(self, ['renderers', self.rendererTypeName]) || {},
          )
          return {
            ...getParentRenderProps(self),
            trackModel: self,
            config,
            onFeatureClick(event, featureId) {
              // try to find the feature in our layout
              const feature = self.features.get(featureId)
              self.selectFeature(feature)
            },
            onClick() {
              self.clearFeatureSelection()
            },
          }
        },
      })),
  )
