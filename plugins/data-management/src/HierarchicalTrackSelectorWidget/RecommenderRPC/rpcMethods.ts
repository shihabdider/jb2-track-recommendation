import RpcMethodType from '@jbrowse/core/pluggableElementTypes/RpcMethodType'
import SerializableFilterChain from '@jbrowse/core/pluggableElementTypes/renderers/util/serializableFilterChain'

import { main } from './fetchTracks.js'

export class MetaindexQueryRPC extends RpcMethodType {
  name = 'MetaindexQueryRPC'

  async deserializeArguments(args: any, rpcDriverClassName: string) {
    const l = await super.deserializeArguments(args, rpcDriverClassName)
    return {
      ...l,
      filters: args.filters
        ? new SerializableFilterChain({
            filters: args.filters,
          })
        : undefined,
    }
  }

  async execute(
    args: {
      sessionId: string
      refName: string
      intervalStart: number
      intervalEnd: number
    },
    rpcDriverClassName: string,
  ) {
    const deserializedArgs = await this.deserializeArguments(
      args,
      rpcDriverClassName,
    )
    const { sessionId, refName, intervalStart, intervalEnd } = deserializedArgs

    const results = await main(refName, intervalStart, intervalEnd)
    return results
  }
}
