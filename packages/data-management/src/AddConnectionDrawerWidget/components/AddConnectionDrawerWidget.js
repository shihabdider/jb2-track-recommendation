import Button from '@material-ui/core/Button'
import Step from '@material-ui/core/Step'
import StepContent from '@material-ui/core/StepContent'
import StepLabel from '@material-ui/core/StepLabel'
import Stepper from '@material-ui/core/Stepper'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { observer } from 'mobx-react-lite'
import { getRoot } from 'mobx-state-tree'
import propTypes from 'prop-types'
import React, { useState } from 'react'
// import HubSourceSelect from './HubSourceSelect'
import ConfigureConnection from './ConfigureConnection'
import ConnectionTypeSelect from './ConnectionTypeSelect'
// import TrackHubRegistrySelect from './TrackHubRegistrySelect'
// import UrlInput from './UrlInput'

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit,
  },
  stepper: {
    backgroundColor: theme.palette.background.default,
  },
  button: {
    marginTop: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  actionsContainer: {
    marginBottom: theme.spacing.unit * 2,
  },
})

const steps = ['Select a Connection Type', 'Configure Connection']

function AddConnectionDrawerWidget(props) {
  const [connectionType, setConnectionType] = useState({})
  const [configModel, setConfigModel] = useState({})
  // // Step 0
  // const [hubType, setHubType] = useState('') // ucsc, jbrowse1
  // // Step 1
  // const [hubSource, setHubSource] = useState('') // trackHubRegistry, ucscCustom, jbrowseRegistry, jbrowseCustom
  // // Step 2
  // const [hubName, setHubName] = useState('')
  // const [hubUrl, setHubUrl] = useState('')
  // const [assemblyNames, setAssemblyNames] = useState([])

  const [activeStep, setActiveStep] = useState(0)

  const { classes, model } = props
  const rootModel = getRoot(model)

  const { pluginManager } = rootModel

  function handleSetConnectionType(newConnectionType) {
    setConnectionType(newConnectionType)
    setConfigModel(newConnectionType.configSchema.create())
  }

  function stepContent() {
    // let StepComponent
    switch (activeStep) {
      case 0:
        return (
          <ConnectionTypeSelect
            connectionTypeChoices={pluginManager.getElementTypesInGroup(
              'connection',
            )}
            connectionType={connectionType}
            setConnectionType={handleSetConnectionType}
          />
        )
      case 1:
        return (
          <ConfigureConnection model={configModel} />
          // <HubSourceSelect
          //   hubType={hubType}
          //   hubSource={hubSource}
          //   setHubSource={event => setHubSource(event.target.value)}
          // />
        )
      // case 2:
      // if (hubSource === 'ucscCustom') StepComponent = UrlInput
      // else if (hubSource === 'trackHubRegistry')
      //   StepComponent = TrackHubRegistrySelect
      // else
      //   return (
      //     <Typography color="error">Unknown Connection Source</Typography>
      //   )
      // return (
      //   <StepComponent
      //     setHubName={setHubName}
      //     hubUrl={hubUrl}
      //     setHubUrl={setHubUrl}
      //     assemblyNames={assemblyNames}
      //     setAssemblyNames={setAssemblyNames}
      //   />
      // )
      default:
        return <Typography>Unknown step</Typography>
    }
  }

  function handleNext() {
    if (activeStep === steps.length - 1) handleFinish()
    else setActiveStep(activeStep + 1)
  }

  function handleBack() {
    setActiveStep(activeStep - 1)
  }

  function handleFinish() {
    rootModel.configuration.addConnection(configModel)
    rootModel.hideDrawerWidget(
      rootModel.drawerWidgets.get('addConnectionDrawerWidget'),
    )
  }

  function checkNextEnabled() {
    if (
      (activeStep === 0 && connectionType.name) ||
      (activeStep === 1 && configModel)
    )
      return true
    return false
  }

  return (
    <div className={classes.root}>
      <Stepper
        className={classes.stepper}
        activeStep={activeStep}
        orientation="vertical"
      >
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {stepContent()}
              <div className={classes.actionsContainer}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  className={classes.button}
                >
                  Back
                </Button>
                <Button
                  disabled={!checkNextEnabled()}
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  className={classes.button}
                  data-testid="addConnectionNext"
                >
                  {activeStep === steps.length - 1 ? 'Connect' : 'Next'}
                </Button>
              </div>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </div>
  )
}

AddConnectionDrawerWidget.propTypes = {
  classes: propTypes.objectOf(propTypes.string).isRequired,
  model: MobxPropTypes.observableObject.isRequired,
}

export default withStyles(styles)(observer(AddConnectionDrawerWidget))
