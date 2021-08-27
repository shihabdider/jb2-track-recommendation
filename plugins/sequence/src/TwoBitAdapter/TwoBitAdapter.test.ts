import { toArray } from 'rxjs/operators'
import Adapter from './TwoBitAdapter'
import configSchema from './configSchema'
import PluginManager from '@jbrowse/core/PluginManager'

const pluginManager = new PluginManager()

test('adapter can fetch features from volvox.2bit', async () => {
  const adapter = new Adapter(
    configSchema.create({
      twoBitLocation: {
        localPath: require.resolve('../../test_data/volvox.2bit'),
        locationType: 'LocalPathLocation',
      },
    }),
    pluginManager,
  )

  const features = adapter.getFeatures({
    refName: 'ctgA',
    start: 0,
    end: 20000,
  })

  const featuresArray = await features.pipe(toArray()).toPromise()
  expect(featuresArray).toMatchSnapshot()

  const features2 = adapter.getFeatures({
    refName: 'ctgA',
    start: 45000,
    end: 55000,
  })

  const featuresArray2 = await features2.pipe(toArray()).toPromise()
  expect(featuresArray2[0].get('end')).toBe(50001)

  const features3 = adapter.getFeatures({
    refName: 'ctgC',
    start: 0,
    end: 20000,
  })

  const featuresArray3 = await features3.pipe(toArray()).toPromise()
  expect(featuresArray3).toMatchSnapshot()
})

test('adapter can fetch regions from with chrom.sizes', async () => {
  const adapter = new Adapter(
    configSchema.create({
      chromSizesLocation: {
        localPath: require.resolve('../../test_data/volvox.chrom.sizes'),
        locationType: 'LocalPathLocation',
      },
    }),
    pluginManager,
  )

  expect(await adapter.getRegions()).toMatchSnapshot()
})
