const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

// const User = require('./user');
// const Status = require('./status');
// const HashTag = require('./hashtag');
// const Media = require('./media');
// const Comment = require('./comment');

const postSchema = new Schema(
    {
        _id: Schema.Types.ObjectId,
        owner: { type: Schema.Types.ObjectId, ref: 'Owner' },
        isAvailable: { type: Boolean, default: true }, // is available to users or not
        //postType: String,//may be one of PUBLIC,ONLY_ME,FOLLOWER
        // postOwnerType: String,
        status: { type: Schema.Types.ObjectId, ref: 'Status' },
        activity:String,
        hashTags: [{ type: Schema.Types.ObjectId, ref: 'HashTag' }],
        petName: String,
        media: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
        likes: [{ type: Schema.Types.ObjectId, ref: 'Owner' }],
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    },
    {
        timestamps: true,
    }
);

postSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Post', postSchema);