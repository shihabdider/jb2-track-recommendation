// library
import { cleanup, fireEvent, render } from '@testing-library/react'
import React from 'react'
import { LocalFile } from 'generic-filehandle'

// locals
import { clearAdapterCache } from '@jbrowse/core/data_adapters/dataAdapterCache'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

import { setup, generateReadBuffer, getPluginManager } from './util'
import JBrowse from '../JBrowse'

expect.extend({ toMatchImageSnapshot })
setup()
afterEach(cleanup)

beforeEach(() => {
  clearAdapterCache()
  sessionStorage.clear()
  fetch.resetMocks()
  fetch.mockResponse(
    generateReadBuffer(url => {
      return new LocalFile(require.resolve(`../../test_data/volvox/${url}`))
    }),
  )
})

describe('authentication', () => {
  it('open a bigwig track that needs authentication', async () => {
    sessionStorage.setItem('dropboxOAuth-token', '1234')
    const pluginManager = getPluginManager()
    const state = pluginManager.rootModel
    const { findByTestId, findAllByTestId, findByText } = render(
      <JBrowse pluginManager={pluginManager} />,
    )
    state.internetAccounts[1].fetchFile = jest
      .fn()
      .mockReturnValue('volvox_microarray_dropbox.bw')
    await findByText('Help')
    state.session.views[0].setNewView(5, 0)
    fireEvent.click(
      await findByTestId('htsTrackEntry-volvox_microarray_dropbox'),
    )
    const canvas = await findAllByTestId(
      'prerendered_canvas',
      {},
      {
        timeout: 10000,
      },
    )
    const bigwigImg = canvas[0].toDataURL()
    const bigwigData = bigwigImg.replace(/^data:image\/\w+;base64,/, '')
    const bigwigBuf = Buffer.from(bigwigData, 'base64')
    expect(bigwigBuf).toMatchImageSnapshot({
      failureThreshold: 0.05,
      failureThresholdType: 'percent',
    })
  }, 15000)
})
