import Head from 'next/head'
import { Web3Provider } from '@ethersproject/providers'
import { useEffect, useReducer, useState } from 'react'
import connectWallet, { getAddress } from 'zkchat/utils/connectWallet'
import { ChatApp, ChatRoom } from 'zkchat'
import { RLN } from 'zkchat/lib/RLN'
import { ChatMessage } from 'zkchat/types/ChatMessage'
import { Input, Button, InputGroup, InputRightElement, Flex, Container } from '@chakra-ui/react'

// export async function getStaticProps(provider: Web3Provider | undefined) {
//   const data = new RLN(provider)
//   return {
//     props: {
//       data,
//     },
//   }
// }

// cache their identity in local storage, and check if there, if so pull that and pass
// in as an existing identity 

// if not an identity --> load a new identity 

export default function Home() {
  const [provider, setProvider] = useState<Web3Provider>()
  const [RLNInstance, setRLNInstance] = useState<RLN>()
  const [alias, setAlias] = useState<string>()
  const [app, setApp] = useState<ChatApp>()
  const [chatRoom, setChatRoom] = useState<ChatRoom>() // current chatroom
  const [newRoomName, setNewRoomName] = useState<string>()
  const [prevMessages, setPrevMessages] = useState<ChatMessage[]>()
  const [curRoom, setCurRoom] = useState<string>()
  const [newMessage, setNewMessage] = useState<string>()

  // useEffect(() => {
  //   (async () => {
  //       const provider = await connectWallet()
  //       if (!provider) return
  //       setProvider(provider)
  //       const rlnProp = await getStaticProps(provider)
  //       setRLNInstance(rlnProp.props.data)
  //       if (!RLNInstance) return
  //       const zkChat = new ChatApp('zkChat', provider, RLNInstance)  
  //       setApp(zkChat)
  //   })()
  // }, [RLNInstance])
  const [messages, updateChatStore] = useReducer(reduceMessages, [])

  // get stored alias or use pub key
  useEffect(() => {
    (async () => {
      const storedAlias = window.localStorage.getItem("alias")
      if (provider) setAlias(storedAlias ?? await getAddress(provider))
    })()
  }, [provider])

  // retrieve past messages 
  useEffect(() => {
    (async () => {
      if (curRoom) setPrevMessages(await app?.fetchChatRoomMsgs(curRoom))
    })
  })

  // update alias
  const updateAlias = () => {
    if (alias) localStorage.setItem("alias", alias)
  }

  // send a message
  const handleSendMessage = () => {
    if (alias && newMessage) chatRoom?.sendMessage(newMessage, alias)
  }


  return (
    <>
      <Head>
        <title>ZK Chat</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex direction={'row'} padding='20px'>
        <Flex direction={'column'} gap='20px'
        borderRight='2px' padding='20px'>

          <Container>
            <>
            Existing Rooms:

              {app?.fetchChatRoomsNames().forEach((roomName) => {
                return <li key={roomName}>{roomName}</li>
              })}
            </>
          </Container>
          <Container>

            Create New Room
            <Input value={newRoomName} placeholder={'Enter room name'} />
            

          </Container>
          <Container>
          Alias:
          <InputGroup size='md'>
          <Input pr='4.5rem' value={alias} 
          onChange={e => setAlias(e.target.value)} 
          placeholder='Enter alias' />

            <InputRightElement width='4.5rem'>
              <Button h='1.75rem' size='sm' onClick={updateAlias}>
                {'Create'}
              </Button>
            </InputRightElement>
          </InputGroup>
          </Container>

          <Flex direction='column' marginTop='100px'>
          Generate new memkeys
        <Button onClick={app?.createIdentity}>Generate New Identity</Button>
      </Flex>
        </Flex>
        <Flex padding='20px' direction={'column'}>
          <>
          Historical Messages:
          {prevMessages}

          <InputGroup size='md'>
            <Input pr='4.5rem' value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={'Enter message'} />

            <InputRightElement width='4.5rem'>
              <Button h='1.75rem' size='sm' onClick={handleSendMessage}>
                {'Send'}
              </Button>
            </InputRightElement>
          </InputGroup>
          </>
        </Flex>
      </Flex>
    </>

  )
}

function reduceMessages(state: ChatMessage[], newMessages: ChatMessage[]) {
  return state.concat(newMessages)
}
