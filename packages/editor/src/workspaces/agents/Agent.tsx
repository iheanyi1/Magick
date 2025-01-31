import axios from 'axios'
import { useSnackbar } from 'notistack'
import { useEffect, useState, useRef } from 'react'
import { useConfig } from '../../contexts/ConfigProvider'
import Button from '../../components/Button'

/* Import All Agent Window Components */
import { pluginManager } from '@magickml/engine'
import { Grid } from '@mui/material'
import AgentPubVariables from './AgentPubVariables'
import styles from './AgentWindowStyle.module.css'

const RenderComp = props => {
  return <props.element props={props} />
}
const AgentWindow = ({
  id,
  updateCallback,
}: {
  id: number
  updateCallback: any
}) => {
  const config = useConfig()
  const { enqueueSnackbar } = useSnackbar()

  const [loaded, setLoaded] = useState(false)

  const [enabled, setEnabled] = useState(false)
  const [openai_api_key, setOpenaiApiKey] = useState('')
  const [eth_private_key, setEthPrivateKey] = useState('')
  const [eth_public_address, setEthPublicAddress] = useState('')

  const [loop_enabled, setLoopEnabled] = useState(false)
  const [loop_interval, setLoopInterval] = useState('')

  const [root_spell, setRootSpell] = useState('')

  const agentDatVal = useRef(null)
  const [agentDataState, setAgentDataState] = useState<any>({})
  const [spellList, setSpellList] = useState<any[]>([])
  const selectedSpellPublicVars = Object.values(
    spellList.find(spell => spell.name === root_spell)?.graph.nodes || {}
  ).filter((node: any) => node?.data?.Public)

  useEffect(() => {
    if (!loaded) {
      ;(async () => {
        const res = await axios.get(`${config.apiUrl}/agents/` + id)

        if (res.data === null) {
          enqueueSnackbar('Agent not found', {
            variant: 'error',
          })
          return
        }

        console.log('res data', res.data)

        let agentData = res.data.data
        setEnabled(res.data.enabled === true)
        if (agentData !== null && agentData !== undefined) {
          agentDatVal.current = agentData
          setOpenaiApiKey(agentData.openai_api_key)
          setRootSpell(agentData.root_spell)
          setEthPrivateKey(agentData.eth_private_key)
          setEthPublicAddress(agentData.eth_public_address)

          setLoopEnabled(agentData.loop_enabled === true)
          setLoopInterval(agentData.loop_interval)
        }
        setLoaded(true)
      })()
    }
  }, [loaded])

  useEffect(() => {
    ;(async () => {
      const res = await fetch(
        `${config.apiUrl}/spells?projectId=${config.projectId}`
      )
      const json = await res.json()

      console.log('res', json)
      console.log('spellList', json)
      setSpellList(json.data)
    })()
  }, [])

  const _delete = () => {
    axios
      .delete(`${config.apiUrl}/agents/` + id)
      .then(res => {
        console.log('deleted', res)
        if (res.data === 'internal error') {
          enqueueSnackbar('Server Error deleting agent with id: ' + id, {
            variant: 'error',
          })
        } else {
          enqueueSnackbar('Entity with id: ' + id + ' deleted successfully', {
            variant: 'success',
          })
        }
        updateCallback()
      })
      .catch(e => {
        enqueueSnackbar('Server Error deleting entity with id: ' + id, {
          variant: 'error',
        })
      })
  }

  const update = (_data: {}) => {
    console.log('Update called', _data)

    axios
      .patch(`${config.apiUrl}/agents/${id}`, _data)
      .then(res => {
        console.log('RESPONSE DATA', res.data)
        if (typeof res.data === 'string' && res.data === 'internal error') {
          enqueueSnackbar('internal error updating agent', {
            variant: 'error',
          })
        } else {
          enqueueSnackbar('updated agent', {
            variant: 'success',
          })
          console.log('response on update', JSON.parse(res.config.data))
          let responseData = res && JSON.parse(res?.config?.data)

          console.log('responseData', responseData)

          setEnabled(responseData.enabled)
          setLoopEnabled(responseData.data.loop_enabled)
          setLoopInterval(responseData.data.loop_interval)

          updateCallback()
        }
      })
      .catch(e => {
        console.log('ERROR', e)
        enqueueSnackbar('internal error updating entity', {
          variant: 'error',
        })
      })
  }

  const exportEntity = () => {
    const _data = {
      enabled,
      data: {
        ...agentDataState,
        openai_api_key,
        loop_enabled,
        loop_interval,
        root_spell,
      },
    }
    const fileName = 'agent'
    const json = JSON.stringify(_data)
    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${fileName}.ent.json`)
    // Append to html link element page
    document.body.appendChild(link)
    // Start download
    link.click()
    if (!link.parentNode) return
    // Clean up and remove the link
    link.parentNode.removeChild(link)
  }
  return !loaded ? (
    <>Loading...</>
  ) : (
    <div className={styles['agent-window']}>
      <div className="form-item">
        <span className="form-item-label">Enabled</span>
        <input
          type="checkbox"
          defaultChecked={enabled}
          onChange={e => {
            setEnabled(e.target.checked)
          }}
        />
      </div>
      {enabled && (
        <>
          <Grid container justifyContent="left" style={{ padding: '1em' }}>
            <Grid item xs={3}>
              <div className="form-item agent-select">
                <span className="form-item-label">Root Spell</span>
                <select
                  name="root_spell"
                  id="root_spell"
                  value={root_spell}
                  onChange={event => {
                    setRootSpell(event.target.value)
                  }}
                >
                  {spellList.length > 0 &&
                    spellList.map((spell, idx) => (
                      <option value={spell.name} key={idx}>
                        {spell.name}
                      </option>
                    ))}
                </select>
              </div>
            </Grid>
            <Grid item xs={3}>
              <div className="form-item">
                <span className="form-item-label">Ethereum Private Key</span>
                <KeyInput
                  value={eth_private_key}
                  setValue={setEthPrivateKey}
                  secret={true}
                />
              </div>
            </Grid>
            <Grid item xs={3}>
              <div className="form-item">
                <span className="form-item-label">Ethereum Public Address</span>
                <KeyInput
                  value={eth_public_address}
                  setValue={setEthPublicAddress}
                  secret={false}
                />
              </div>
            </Grid>
          </Grid>

          {selectedSpellPublicVars.length !== 0 && (
            <AgentPubVariables
              update={update}
              publicVars={selectedSpellPublicVars}
            />
          )}

          {loop_enabled && (
            <>
              <div className="form-item">
                <span className="form-item-label">Loop Interval</span>
                <input
                  type="text"
                  pattern="[0-9]*"
                  defaultValue={loop_interval}
                  onChange={e => {
                    setLoopInterval(e.target.value)
                  }}
                />
              </div>
            </>
          )}
          {pluginManager.getAgentComponents().map((value, index, array) => {
            return (
              <RenderComp
                key={index}
                element={value}
                agentData={agentDatVal.current}
                setAgentDataState={setAgentDataState}
              />
            )
          })}
        </>
      )}
      <div className="form-item entBtns">
        <Button
          onClick={() => {
            const data = {
              enabled,
              data: {
                ...agentDataState,
                openai_api_key,
                eth_private_key,
                eth_public_address,
                loop_enabled,
                loop_interval,
                root_spell,
              },
            }
            update(data)
          }}
          style={{ marginRight: '10px', cursor: 'pointer' }}
        >
          Update
        </Button>
        <Button onClick={() => _delete()}>Delete</Button>
        <Button onClick={() => exportEntity()}>Export</Button>
      </div>
    </div>
  )
}

const KeyInput = ({
  value,
  setValue,
  secret,
}: {
  value: string
  setValue: any
  secret: boolean
}) => {
  const addKey = (str: string) => {
    setValue(str)
  }

  const removeKey = () => {
    setValue('')
  }

  const obfuscateKey = (str: string) => {
    const first = str.substring(0, 6)
    const last = str.substring(str.length - 4, str.length)
    return `${first}....${last}`
  }

  return value ? (
    <>
      <p>{secret ? obfuscateKey(value) : value}</p>
      <Button onClick={removeKey}>remove</Button>
    </>
  ) : (
    <input
      type={secret ? 'password' : 'input'}
      value={value}
      onChange={e => {
        addKey(e.target.value)
      }}
    />
  )
}

export default AgentWindow
