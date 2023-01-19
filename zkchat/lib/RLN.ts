import { GOERLI } from "zkchat/utils/checkChain";
import { Registry, RLN as RLNjs, RLNFullProof } from "rlnjs" 
import { Contract, ethers } from "ethers";
import { RLN_ABI, RLN_ADDRESS } from "zkchat/rln/contractInfo";
import { Web3Provider } from "@ethersproject/providers";
import * as path from 'path'
import { Identity } from '@semaphore-protocol/identity';
import * as fs from 'fs'

/* zkey file path */
const vkey = JSON.parse(fs.readFileSync("zkchat/zkeyFiles/verification_key.json", "utf-8"))

// cache class has rln_identifier (addProof to cache, evaluateNullifierAtEpoch),

export class RLN {
    public registry: Registry
    public identityCommitments: bigint[]
    // public identifier: Identity
    public contract: Contract
    public rlnjsInstance: RLNjs

    constructor(provider?: ethers.providers.Provider) {
        this.contract = new ethers.Contract(RLN_ADDRESS, RLN_ABI) // might need to add back provider
        this.registry = new Registry(20)
        this.rlnjsInstance = new RLNjs("../zkeyFiles/rln.wasm", "./zkeyFiles/rln_final.zkey", vkey)
        // this.identifier = this.rlnjsInstance.identity
        this.identityCommitments = []
    }

    public async verifyProof(rlnProof: RLNFullProof) {
      return await RLNjs.verifyProof(vkey, rlnProof)
    }

    /* construct RLN member tree locally */
    public async constructRLNMemberTree() {
      const memRegEvent = this.contract.filters.MemberRegistered()

      // populate merkle tree with existing users
      const registeredMembers = await this.contract.queryFilter(memRegEvent)
      registeredMembers.forEach(event => {
          if (event.args) this.registry.addMember(event.args.memkey)
      })

      // listen to new members added to rln contract
      this.contract.on(memRegEvent, (event) => {
        this.registry.addMember(event.args.memkey)
      })
    }
} 

/* 
If existing identity, pass in identity.toString() to constructor
*/

export class RLNMember {
    private identity: Identity
    private identityCommitment: bigint
    private memIndex: number
    public rln: RLN

    constructor (
        rln: RLN,
        existingIdentity?: string, 
    ) {
        this.rln = rln
        this.identity = (existingIdentity) ? new Identity(existingIdentity) : new Identity()
        this.identityCommitment = this.identity.getCommitment() 
        this.rln.registry.addMember(this.identityCommitment)
        this.memIndex = this.rln.registry.indexOf(this.identityCommitment)
    }

    public getIdentityAsString() {
      return this.identity.toString()
    }

    public async generateProof() {
      const merkleProof = await this.rln.registry.generateMerkleProof(this.identityCommitment)
      return merkleProof
    }

    public generateRLNcredentials(appName: string) {
      return { 
        "application": appName, 
        // "appIdentifier": this.rln.identifier,
        "credentials": [{
          "key": this.identity.getNullifier(),
          "commitment": this.identityCommitment,
          "membershipGroups": [{
            "chainId": GOERLI, // chainge to optimism when time
            "contract": this.rln.contract,
            "treeIndex": this.rln.registry.indexOf(this.identityCommitment)
          }]
        }],
        "version": 1 // change
      }
    }

    /* Allow new user registraction with rln contract for rln registry */
    public async registerUserOnRLNContract(provider: Web3Provider) {
      const price = await this.rln.contract.MEMBERSHIP_DEPOSIT()
      const signer = provider.getSigner()

      const rlnContractWithSigner = this.rln.contract.connect(signer)
      const txResponse = await rlnContractWithSigner.register(this.identityCommitment, {value: price})
      console.log("Transaction broadcasted: ", txResponse)

      const txReceipt = await txResponse.wait()
      console.log("Transaction receipt", txReceipt)

      this.memIndex = txReceipt.events[0].args.index.toNumber()
    }
}
