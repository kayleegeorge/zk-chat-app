import { Message, RateLimitProof, WakuLight } from "js-waku/lib/interfaces"
import { Web3Provider } from "@ethersproject/providers"
import { RoomType } from "zkchat/types/ChatRoomOptions"
import { UnsubscribeFunction } from "js-waku/lib/waku_filter"
import { MembershipKey, Proof, RLNDecoder, RLNEncoder, RLNInstance } from "../../node_modules/@waku/rln/dist/index.d"
import { ChatMessage } from "zkchat/types/ChatMessage"
import { dateToEpoch } from "zkchat/utils/formatting"
import { Connection, ConnectionMethod, ProofState } from "zkchat/lib/Connection"
import { RLN, RLNMember } from "zkchat/lib/RLN"
import { RLNFullProof } from "rlnjs"
import { useReducer } from "react"

export type MessageStore = {
    message: string
    epoch: bigint
    rlnProof: RLNFullProof | undefined
    proofState: ProofState
    alias: string
}

/*
 * Create a chat room
 */
export class ChatRoom {
    public roomType: RoomType
    public contentTopic: string
    public chatStore: ChatMessage[] // eventually switch to MessageStore[]
    public rlnInstance: RLN
    public provider: Web3Provider 
    public connection: Connection
    private rlnMember: RLNMember
    private chatMembers: string[]
    public unsubscribeWaku?: UnsubscribeFunction 

    public constructor(
        contentTopic: string,
        roomType: RoomType,
        provider: Web3Provider,
        rlnMember: RLNMember, 
        chatMembers: string[],
        rlnInstance: RLN,
    ) {
        this.contentTopic = contentTopic
        this.roomType = roomType
        this.provider = provider
        this.rlnInstance = rlnInstance
        this.rlnMember = rlnMember
        this.chatMembers = chatMembers
        this.chatStore = []

        const [messages, updateChatStore] = useReducer(this.reduceMessages, this.chatStore)
        this.connection = new Connection(ConnectionMethod.Waku, this.rlnInstance, this.rlnMember, updateChatStore, this.contentTopic) 
    }

    /* retrieve Store Messages */
    public async retrieveMessageStore() {
        this.connection.retrieveMessageStore()
    }
    
    /* send a message */
    public async sendMessage(text: string, alias: string) {
        this.connection.sendMessage(text, alias)
    }

    /* clean up message store rln proofs after n epochs */
    public async cleanMessageStore(n: number) {
        let msgIndex = -1
        const time = new Date()
        const curTime = BigInt(Math.floor(time.valueOf() / 1000))
        // TODO: destroy rln proof after n epochs

        // while(this.chatStore[msgIndex].epoch - curTime > n) {
        //    this.chatStore[msgIndex].rln_proof = undefined 
        //    msgIndex += 1 
        // } 
    }

    public reduceMessages(state: ChatMessage[], newMessages: ChatMessage[]) {
        return state.concat(newMessages)
    }

    /* basic util functions */
    public getAllMessages() {
        return this.chatStore
    }
    public getLastMessage() {
        return this.chatStore[-1]
    }
    public async addChatMember(memPubkey: string) {
        if (this.roomType == RoomType.PrivGroup && this.chatMembers.length == 5) {
            console.error('Cannot add more than 5 members to a private group')
        } else {
            this.chatMembers.push(memPubkey)
        }
    }
    public getChatMembers() {
        return this.chatMembers
    }
}