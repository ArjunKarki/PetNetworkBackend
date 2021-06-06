const mongoose = require('mongoose');
const Schema = mongoose.Schema

const ownerSchema = mongoose.Schema({
    
    _id: Schema.Types.ObjectId,

    playerIds: [{ playerId: String, status: String }],

    firstName: { type: String },

    lastName: { type: String },

    country: { type: String },

    city: { type: String },

    job: { type: String },

    dob: { type: String },

    phNo: { type: String },

    gender: { type: String },

    description: { type: String },

    createdDate: { type: String },

    editedDate: { type: String },

    credentialId: { type: Schema.Types.ObjectId, ref: "OwnerCredential" },

    profile: { type: Schema.Types.ObjectId, ref: "Media" },

    isLogin: { type: Boolean, default: true },

    pets: [{ type: Schema.Types.ObjectId, ref: "Pet" }],

    Post: [{ type: Schema.Types.ObjectId, ref: "Post" }],

    //articles: [{ type: Schema.Types.ObjectId, ref: "Article" }],

    followerLists: [{ type: Schema.Types.ObjectId, ref: "Owner" }],

    followingLists: [{ type: Schema.Types.ObjectId, ref: "Owner" }],

    notiLists: [{ type: Schema.Types.ObjectId, ref: "Notification" }],

})

module.exports = mongoose.model("Owner", ownerSchema);