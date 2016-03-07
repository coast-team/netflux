class JoiningPeer {
  constructor (id, intermediaryId) {
    this.id = id
    this.intermediaryId = intermediaryId
    this.intermediaryChannel = null
    this.channelsToAdd = []
    this.channelsToRemove = []
  }

  toAddList (channel) {
    this.channelsToAdd[this.channelsToAdd.length] = channel
  }

  toRemoveList (channel) {
    this.channelsToAdd[this.channelsToAdd.length] = channel
  }

}

export default JoiningPeer
