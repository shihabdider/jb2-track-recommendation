/* eslint-disable react/prop-types */
import React from 'react'
import { observer } from 'mobx-react'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'

import type PluginManager from '@jbrowse/core/PluginManager'

import type { BasePlugin } from '../types'

const useStyles = makeStyles(() => ({
  card: {
    margin: '1em',
  },
}))

function PluginCard({ pluginManager }: { pluginManager: PluginManager }) {
  const classes = useStyles()

  const { plugins } = pluginManager
  const corePlugins = plugins
    .filter((p: BasePlugin) =>
      Boolean(pluginManager.pluginMetaData[p.name]?.isCore),
    )
    .map((p: BasePlugin) => p.name)
  const externalPluginsRender = plugins
    .filter((plugin: BasePlugin) => {
      return !corePlugins.includes(plugin.name)
    })
    .map((plugin: BasePlugin) => {
      return (
        <ListItem key={plugin.name}>
          <IconButton aria-label="remove">
            <CloseIcon />
          </IconButton>
          <Typography>{plugin.name}</Typography>
        </ListItem>
      )
    })

  return (
    <List>
      {externalPluginsRender.length ? (
        externalPluginsRender
      ) : (
        <Typography>No plugins currently installed</Typography>
      )}
    </List>
  )
}

export default observer(PluginCard)
