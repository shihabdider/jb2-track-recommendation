import {
  isStateTreeNode,
  Instance,
  SnapshotIn,
  IAnyStateTreeNode,
} from 'mobx-state-tree'
import { AnyConfigurationModel } from '../../configuration/configurationSchema'

import assemblyManager from '../../assemblyManager'
import textSearchManager from '../../TextSearch/TextSearchManager'
import { MenuItem } from '../../ui'
import {
  NoAssemblyRegion as MUNoAssemblyRegion,
  Region as MUIRegion,
  LocalPathLocation as MULocalPathLocation,
  UriLocation as MUUriLocation,
  BlobLocation as MUBlobLocation,
} from './mst'
import RpcManager from '../../rpc/RpcManager'
import { Feature } from '../simpleFeature'

export * from './util'

/** abstract type for a model that contains multiple views */
export interface AbstractViewContainer {
  views: AbstractViewModel[]
  removeView(view: AbstractViewModel): void
  addView(
    typeName: string,
    initialState: Record<string, unknown>,
  ): AbstractViewModel
}
export function isViewContainer(
  thing: unknown,
): thing is AbstractViewContainer {
  return (
    isStateTreeNode(thing) &&
    'removeView' in thing &&
    'addView' in thing &&
    'views' in thing
  )
}

export type NotificationLevel = 'error' | 'info' | 'warning' | 'success'

export type AssemblyManager = Instance<ReturnType<typeof assemblyManager>>
export type TextSearchManager = Instance<ReturnType<typeof textSearchManager>>
export interface BasePlugin {
  version?: string
  name: string
  url?: string
}

export interface JBrowsePlugin {
  name: string
  authors: string[]
  description: string
  location: string
  url: string
  license: string
  image?: string
}

export type DialogComponentType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | React.LazyExoticComponent<React.FC<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | React.FC<any>

/** minimum interface that all session state models must implement */
export interface AbstractSessionModel extends AbstractViewContainer {
  setSelection(feature: Feature): void
  clearSelection(): void
  configuration: AnyConfigurationModel
  rpcManager: RpcManager
  assemblyNames: string[]
  assemblies: AnyConfigurationModel[]
  selection?: unknown
  duplicateCurrentSession?(): void
  notify(message: string, level?: NotificationLevel): void
  assemblyManager: AssemblyManager
  version: string
  getTrackActionMenuItems?: Function
  addAssembly?: Function
  removeAssembly?: Function
  textSearchManager?: TextSearchManager
  connections: AnyConfigurationModel[]
  deleteConnection?: Function
  sessionConnections?: AnyConfigurationModel[]
  connectionInstances?: { name: string }[]
  makeConnection?: Function
  adminMode?: boolean
  showWidget?: Function
  addWidget?: Function

  addTrackConf?: Function
  DialogComponent?: DialogComponentType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DialogProps: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDialogComponent: (dlg?: DialogComponentType, props?: any) => void
}
export function isSessionModel(thing: unknown): thing is AbstractSessionModel {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'rpcManager' in thing &&
    'configuration' in thing
  )
}

/** abstract interface for a session allows editing configurations */
export interface SessionWithConfigEditing extends AbstractSessionModel {
  editConfiguration(configuration: AnyConfigurationModel): void
}
export function isSessionModelWithConfigEditing(
  thing: unknown,
): thing is SessionWithConfigEditing {
  return isSessionModel(thing) && 'editConfiguration' in thing
}

/** abstract interface for a session that manages widgets */
export interface SessionWithWidgets extends AbstractSessionModel {
  visibleWidget?: { id: string }
  widgets: Map<string, unknown>
  addWidget(
    typeName: string,
    id: string,
    initialState?: Record<string, unknown>,
    configuration?: { type: string },
  ): void
  showWidget(widget: unknown): void
}
export function isSessionModelWithWidgets(
  thing: unknown,
): thing is SessionWithWidgets {
  return isSessionModel(thing) && 'widgets' in thing
}

export interface SessionWithSessionPlugins extends AbstractSessionModel {
  sessionPlugins: JBrowsePlugin[]
  addSessionPlugin: Function
  removeSessionPlugin: Function
}
export function isSessionWithSessionPlugins(
  thing: unknown,
): thing is SessionWithSessionPlugins {
  return isSessionModel(thing) && 'sessionPlugins' in thing
}

/** abstract interface for a session that manages a global selection */
export interface SelectionContainer extends AbstractSessionModel {
  selection?: unknown
  setSelection(thing: unknown): void
}
export function isSelectionContainer(
  thing: unknown,
): thing is SelectionContainer {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'selection' in thing &&
    'setSelection' in thing
  )
}

/** minimum interface that all view state models must implement */
export interface AbstractViewModel {
  id: string
  type: string
  width: number
  setWidth(width: number): void
}
export function isViewModel(thing: unknown): thing is AbstractViewModel {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'width' in thing &&
    'setWidth' in thing
  )
}

type AbstractTrackModel = {}
export function isTrackModel(thing: unknown): thing is AbstractTrackModel {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'configuration' in thing &&
    // @ts-ignore
    thing.configuration.trackId
  )
}

export interface AbstractDisplayModel {
  id: string
  parentTrack: AbstractTrackModel
  renderDelay: number
  rendererType: any // eslint-disable-line @typescript-eslint/no-explicit-any
  cannotBeRenderedReason?: string
}
export function isDisplayModel(thing: unknown): thing is AbstractDisplayModel {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'configuration' in thing &&
    // @ts-ignore
    thing.configuration.displayId
  )
}

export interface TrackViewModel extends AbstractViewModel {
  showTrack(trackId: string): void
  hideTrack(trackId: string): void
}
export function isTrackViewModel(thing: unknown): thing is TrackViewModel {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'showTrack' in thing &&
    'hideTrack' in thing
  )
}

/** minimum interface for the root MST model of a JBrowse app */
export interface AbstractRootModel {
  jbrowse: IAnyStateTreeNode
  session?: AbstractSessionModel
  setDefaultSession?(): void
  adminMode?: boolean
}

/** root model with more included for the heavier JBrowse web and desktop app */
export interface AppRootModel extends AbstractRootModel {
  isAssemblyEditing: boolean
  isDefaultSessionEditing: boolean
  setAssemblyEditing: (arg: boolean) => boolean
  setDefaultSessionEditing: (arg: boolean) => boolean
}

/** a root model that manages global menus */
export interface AbstractMenuManager {
  appendMenu(menuName: string): void
  insertMenu(menuName: string, position: number): number
  insertInMenu(menuName: string, menuItem: MenuItem, position: number): number
  appendToMenu(menuName: string, menuItem: MenuItem): number
  appendToSubMenu(menuPath: string[], menuItem: MenuItem): number
  insertInSubMenu(
    menuPath: string[],
    menuItem: MenuItem,
    position: number,
  ): number
}
export function isAbstractMenuManager(
  thing: unknown,
): thing is AbstractMenuManager {
  return (
    typeof thing === 'object' &&
    thing !== null &&
    'appendMenu' in thing &&
    'appendToSubMenu' in thing
  )
}

// Empty interfaces required by mobx-state-tree
// See https://mobx-state-tree.js.org/tips/typescript#using-a-mst-type-at-design-time
/* eslint-disable @typescript-eslint/no-empty-interface */

export interface NoAssemblyRegion
  extends SnapshotIn<typeof MUNoAssemblyRegion> {}

export interface Region extends SnapshotIn<typeof MUIRegion> {}

export interface LocalPathLocation
  extends SnapshotIn<typeof MULocalPathLocation> {}

export interface UriLocation extends SnapshotIn<typeof MUUriLocation> {}

export interface BlobLocation extends SnapshotIn<typeof MUBlobLocation> {}

export type FileLocation = LocalPathLocation | UriLocation | BlobLocation

/* eslint-enable @typescript-eslint/no-empty-interface */

// These types are slightly different than the MST models representing a
// location because a blob cannot be stored in a MST, so this is the
// pre-processed file location
export type PreUriLocation = { uri: string }
export type PreLocalPathLocation = { localPath: string }
export type PreBlobLocation = { blob: File }
export type PreFileLocation =
  | PreUriLocation
  | PreLocalPathLocation
  | PreBlobLocation
