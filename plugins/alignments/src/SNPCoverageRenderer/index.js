import { ConfigurationSchema } from '@gmod/jbrowse-core/configuration'
import ConfigSchema from './configSchema'

export { WiggleRendering as ReactComponent } from '@gmod/jbrowse-plugin-wiggle'
export { default } from './SNPCoverageRenderer'

export const configSchema = ConfigurationSchema(
  'SNPCoverageRenderer',
  {},
  { baseConfiguration: ConfigSchema, explicitlyTyped: true },
)
