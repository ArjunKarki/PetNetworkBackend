const mongoose = require('mongoose');

const matchSchema = mongoose.Schema(
    
    {
        _id: mongoose.Schema.Types.ObjectId,

        matchRequestFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },

        matchRequestTo: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },

        matchStatus: { type: String },

        requestedDate: { type: String },

        acceptedDate: { type: String }
        
    }
)

module.exports = mongoose.model("MatchStatus", matchSchema);