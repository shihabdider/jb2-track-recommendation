import React from 'react'
import { render } from '@testing-library/react'
import AboutWidget from './AboutWidget'
import { types } from 'mobx-state-tree'
import { ConfigurationSchema } from '@jbrowse/core/configuration'

describe('<AboutWidget />', () => {
  it('renders', () => {
    const session = types
      .model({
        configuration: ConfigurationSchema('Null', {}),
        rpcManager: types.frozen({}),
        widgetModel: types.model({ type: types.literal('AboutWidget') }),
      })
      .create(
        { widgetModel: { type: 'AboutWidget' } },
        {
          pluginManager: {
            pluginMetadata: {},
            plugins: [
              {
                name: 'HelloPlugin',
                version: '1.0.0',
                url: 'http://google.com',
              },
            ],
          },
        },
      )
    const { container } = render(<AboutWidget model={session.widgetModel} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
