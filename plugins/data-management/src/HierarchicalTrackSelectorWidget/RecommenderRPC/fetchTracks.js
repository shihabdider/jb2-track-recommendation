import { TabixIndexedFile } from '@gmod/tabix'

async function getTracks(refName, start, end) {
  const testFilePath = './metaindex.bed.sorted.gz'
  const testFileTbiPath = './metaindex.bed.sorted.gz.tbi'
  // basic usage under node.js provides a file path on the filesystem to bgzipped file
  // it assumes the tbi file is path+'.tbi' if no tbiPath is supplied
  const tbiIndexed = new TabixIndexedFile({
    path: testFilePath,
    tbiPath: testFileTbiPath,
  })

  // iterate over lines in the specified region
  const tracks = []
  const result = await tbiIndexed.getLines(
    refName,
    start,
    end,
    (line, fileOffset) => {
      const [refName, start, end, trackName] = line.split('\t')
      if (!tracks.includes(trackName)) {
        tracks.push(trackName)
      }
    },
  )

  console.log(tracks)
  return tracks
}

async function main(refName, start, end) {
  const tracks = await getTracks(refName, start, end)
  return tracks
}

export { main }
