import { types } from 'mobx-state-tree'
import { ConfigurationSchema } from '@jbrowse/core/configuration'

export default ConfigurationSchema(
  'Gff3TabixAdapter',
  {
    gffGzLocation: {
      type: 'fileLocation',
      defaultValue: { uri: '/path/to/my.gff.gz', locationType: 'UriLocation' },
    },
    index: ConfigurationSchema('Gff3TabixIndex', {
      indexType: {
        model: types.enumeration('IndexType', ['TBI', 'CSI']),
        type: 'stringEnum',
        defaultValue: 'TBI',
      },
      location: {
        type: 'fileLocation',
        defaultValue: {
          uri: '/path/to/my.gff.gz.tbi',
          locationType: 'UriLocation',
        },
      },
    }),
    dontRedispatch: {
      type: 'stringArray',
      defaultValue: ['chromosome', 'region'],
    },
  },
  { explicitlyTyped: true },
)
