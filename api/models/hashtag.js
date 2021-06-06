const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hashTagSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        type: String, // may be one of POST,EVENT,...
        hashtag_owner: Schema.Types.ObjectId, // post id or article id base on type
        hashTagString: String
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('HashTag', hashTagSchema);