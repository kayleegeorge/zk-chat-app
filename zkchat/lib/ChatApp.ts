import { Web3Provider } from '@ethersproject/providers'
import { ChatRoom } from "zkchat/lib/ChatRoom"
import { RoomType } from "zkchat/types/ChatRoomOptions"
import { checkChain, GOERLI } from "zkchat/utils/checkChain"
import { Identity } from "@semaphore-protocol/identity"
import { RLN } from "zkchat/lib/RLN"

export default class ChatApp {
    public appName: string
    public chatRoomStore: Map<string, ChatRoom>
    public rln: RLN
    public provider: Web3Provider

    public constructor(
        appName: string,
        provider: Web3Provider,
        existingIdentity: string
      ) {
        this.appName = appName
        this.provider = provider
        this.rln = new RLN(existingIdentity, provider)
    
        this.chatRoomStore = new Map<string, ChatRoom>()
      }

    // ref: https://semaphore.appliedzkp.org/docs/guides/identities
    /* identity generation without RLN */
    public createIdentity() {
      const identity = new Identity()
      console.log(identity)
      return identity
    }

    /* app-level user registration: add user to chatApp and RLN registry */
    public async registerUser(existingIdentity?: string) {
      this.rln.constructRLNMemberTree() 
      await this.rln.registerUserOnRLNContract(this.provider) // TODO: maybe this not needed? investigate
      return this.rln.identity
    }

    /* create chat room */
    public createChatRoom(name: string, roomType: RoomType, identity: string, chatMembers: string[]) {
      const contentTopic = `/${this.appName}/0.0.1/${roomType}-${name}/proto/`
      if (contentTopic in this.chatRoomStore) {
        console.log('Error: Please choose different chat name.')
      }
      if (chatMembers) {
        const chatroom = new ChatRoom(contentTopic, roomType, this.provider, chatMembers, this.rln)
        this.chatRoomStore.set(contentTopic, chatroom)
        return chatroom
      } else {
        console.log("You must register as a user before creating a chat room.")
      }
    }

    /* fetch all chat room messages for a given chatroom */
    public async fetchChatRoomMsgs(name: string) {
      return this.chatRoomStore.get(name)?.getAllMessages()
    }

    public fetchChatRoomsNames() {
      return Array.from(this.chatRoomStore.keys())
    }
  }
