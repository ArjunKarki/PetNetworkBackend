const mongoose = require('mongoose')
const _ = require('lodash')
const fs = require('fs')
const sharp = require('sharp')
const jwt = require("jsonwebtoken")
const OwnerCredential = require('../models/owner-credential')
const Owner = require('../models/owner')
const Media = require('../models/media')
const Notification = require('../models/notification')
const { JWT_KEY } = require('../config/config')
let { generateOTP, sendEmail } = require('../utils/signup-services')
const { OWNER_PROPIC_FOLDER } = require('../config/config')

exports.check_email = async (req, res, next) => {
    console.log("Check Email", req.body);
    try {
        const owner = await OwnerCredential.find({ email: req.body.email }).exec();
        if (owner.length >= 1) {
            return res.status(200).json({
                "message": "EXIST"
            })
        } else {
            return res.status(200).json({
                "message": "NOT_EXIST"
            })
        }
    } catch (error) {
        console.log("Check Email Error", error)
        return res.status(500).json({
            "message": "ERROR"
        })
    }
}


exports.send_login_email = async (req, res) => {
    let result = ''
    let ownerEmail = req.body.email
    let ownerName = req.body.ownerName
    let code = generateOTP()
    let emailText = "<br><br>\n"
        + "                    Your beauty memory with your lovely pets begins here. We are excited to have you with us. You can now discover stories from other pet lovers and do better care to your pets with our feature rich app.<br><br>\n"
        + "		     <b>One Time Password is here</b><br><br><div style=\"text-align: center: padding: 8px;\"><b> ";
    console.log("code", code);

    try {
        result = await sendEmail(code, ownerEmail, ownerName, emailText)
        console.log("result...", result)
        res.status(200).json({
            "message": result
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            "message": "ERROR"
        })

    }
}

exports.save_owner_info = async (req, res, next) => {

    try {
        let propic_file = req.file;
        let creInfo = JSON.parse(req.body.creInfo);
        let ownerInfo = JSON.parse(req.body.ownerInfo);

        const owners = await OwnerCredential.find({ email: creInfo.email }).exec();

        if (owners && owners.length >= 1) {
            res.status(409).json({
                message: "MAIL_EXISTS"
            })
        } else {
            // init owner-credential
            const creOwner = new OwnerCredential({
                _id: new mongoose.Types.ObjectId(),
                email: creInfo.email,
                password: creInfo.password
            })
            //save owner credential
            const rnCreOwner = await creOwner.save();

            //init owner info
            const owner = new Owner({
                _id: new mongoose.Types.ObjectId(),
                playerIds: [{ playerId: ownerInfo.playerId, status: 'active' }],
                firstName: ownerInfo.firstName,
                lastName: ownerInfo.lastName,
                country: ownerInfo.country,
                city: ownerInfo.city,
                job: ownerInfo.job,
                dob: ownerInfo.dob,
                phNo: ownerInfo.phNo,
                gender: ownerInfo.gender,
                description: ownerInfo.description,
                createdDate: ownerInfo.createdDate,
                credentialId: rnCreOwner._id
            })

            //save owner
            const rnOwner = await owner.save();

            //add ownerId to credential Owner
            creOwner.owner = rnOwner._id;
            creOwner.save();

            if (propic_file) {

                const media_modal = new Media({
                    _id: new mongoose.Types.ObjectId,
                    type: "OWNER_PROFILE"
                })

                //get metadata of propic
                const pic = await sharp(propic_file.path).metadata();

                media_modal.width = pic.width;
                media_modal.height = pic.height;
                media_modal.contentType = propic_file.mimetype;
                media_modal.mediaUrl = propic_file.filename;
                const rnMedia = await media_modal.save();
                owner.profile = rnMedia._id
                owner.save()
            }

            const token = jwt.sign(
                {
                    email: creOwner.email,
                    id: creOwner._id
                },
                JWT_KEY,
                {
                    expiresIn: "240h"
                }
            );

            res.status(201).json({
                token: token,
                ownerId: owner._id
            });

        }

    } catch (err) {
        console.log("Save Owner Inf0", err)
        res.status(500).json({
            "message": "ERROR"
        })

    }
}

exports.get_profile_pic = async (req, res) => {
    const ownerId = req.params.ownerId;
    try {
        const owner = await Owner.findById(ownerId);
        if (owner) {
            try {
                const propic = await Media.findById(owner.profile);

                if (propic) {
                    const propicUrl = OWNER_PROPIC_FOLDER + propic.mediaUrl;

                    fs.readFile(propicUrl, (err, data) => {
                        if (err) {
                            console.log(error)
                            res.status(404).json(
                                {
                                    message: "NO_FILE"
                                }
                            )
                        }
                        res.writeHead(200, { 'Content-Type': propic.contentType });
                        res.end(data);
                    })
                }
            } catch (error) {
                console.log(error)
                return res.status(404).json(
                    {
                        message: "NO_FILE"
                    }
                )
            }
        }
    } catch (error) {
        console.log("Error", error)
        return res.status(500).json({
            error: error
        })
    }
}

exports.owner_login = async (req, res) => {
    //client playerId
    const playerId = req.body.playerId;

    try {
        const creOwners = await OwnerCredential.find({ email: req.body.email, password: req.body.password }).exec();
        if (creOwners && creOwners.length < 1) {
            return res.status(401).json({
                message: "Auth failed"
            })
        }

        const owners = await Owner.findById({ _id: creOwners[0].owner })
        //check playerId not to duplicate
        const ids = Object.assign([], owners.playerIds);
        const index = _.findIndex(ids, { playerId });
        if (index > -1) {
            ids[index].playerId = playerId;
            ids[index].status = "active";
            //ids[index] = { playerId, status: 'active' };
        } else {

            ids.push({ playerId, status: "active" });
        }

        owners.playerIds = ids;
        await owners.save();

        const token = jwt.sign(
            {
                email: creOwners[0].email,
                id: creOwners[0]._id
            },
            JWT_KEY,
            {
                expiresIn: "240h"
            }
        );
        let ownerName = owners.firstName + " " + owners.lastName;
        return res.status(200).json(
            {
                token: token,
                ownerId: owners._id,
                ownerName: ownerName
            }
        )
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })

    }
}

exports.notify_state_change = async (req, res, next) => {
    const ownerId = req.params.ownerId;
    const { playerId, status } = req.body;
    let owner = await Owner.findById(ownerId);
    if (owner) {
        let playerIds = Object.assign([], owner.playerIds);
        const index = _.findIndex(playerIds, { playerId });
        if (index > -1) {
            playerIds[index] = { playerId, status };
            owner.playerIds = playerIds;
            await owner.save();

            return res.status(200).json({
                message: 'OK'
            });
        }

        return res.status(200).json({
            message: 'OK'
        });
    }

    return res.status(404).json({
        message: 'No valid user found for provided user id.'
    });
}

exports.owner_logout = async (req, res) => {
    const ownerId = req.body.ownerId;
    const playerId = req.body.playerId
    try {
        let owner = await Owner.findById(ownerId);
        if (owner) {
            //database playerIds
            let playerIds = Object.assign([], owner.playerIds);

            const index = _.findIndex(playerIds, { playerId });

            if (index !== -1) {
                playerIds.splice(index, 1);
                owner.playerIds = playerIds
            }
            let rnOwner = await owner.save()

            return res.status(200).json({
                message: "User logged out!"
            })
        } else {
            return res.status(404).json({
                message: "No valid entry found for provided user id"
            })
        }
    } catch (error) {
        return res.status(500).json({
            error: error
        })

    }
}

exports.get_ownerInfo = async (req, res) => {
    try {
        const ownerId = req.params.ownerId

        const owner = await Owner.findById(ownerId)
        res.status(200).json({
            "ownerInfo": owner
        })

    } catch (error) {
        console.log(error)
    }
}

exports.get_unsaved_notis = async (req, res, next) => {
    const ownerId = req.params.ownerId;
    const owner = await Owner.findById(ownerId);
    const MAX_NOTI_COUNT = 10;
    let count = 0;
    let all_notis = [];

    if (owner) {
        const notis = owner.notiLists;
        for (let i = notis.length; i--;) {
            const myNoti = await Notification.find({ _id: notis[i], isSavedInClient: false })
                .populate('createdBy', 'firstName lastName')
                .populate({
                    path: 'pet',
                    select: 'petName petProPic reminder',
                    populate: {
                        path: "reminder",
                        select: "date type"
                    },
                })
                .populate('media', 'contentType')
                .exec();
                
            if (myNoti && myNoti[0]) {
                all_notis.push(myNoti[0]);
            }

            if (count === MAX_NOTI_COUNT) break;
            count++;
        }

        return res.status(200).send(all_notis);
    }

    return res.status(404).json({
        message: 'No valid owner found for provided owner id.'
    })
}

exports.get_about_Owner = async (req, res) => {
    const ownerId = req.params.ownerId
    try {
        const owner = await Owner.findById(ownerId, 'country city phNo dob description');
        res.status(200).json({
            "aboutOwner": owner
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            "Error": error
        })
    }
}

exports.get_follower_list = async (req, res) => {

    const followerId = req.params.followerId
    const followedId = req.params.followedId
    let rnfollower_list = []

    try {
        let followed_owner = await Owner
            .findById(followedId, 'followerLists -_id')
            .populate("followerLists", "firstName lastName")
            .exec();

        let follower_owner = await Owner
            .findById(followerId, 'followingLists')
            .exec();

        let followerList = JSON.parse(JSON.stringify(followed_owner.followerLists))
        let ownerFollowingList = JSON.parse(JSON.stringify(follower_owner.followingLists))
        for (let i = 0; i < followerList.length; i++) {
            if (ownerFollowingList.includes(followerList[i]._id)) {
                followerList[i].status = "following"
            } else {
                followerList[i].status = "follow"
            }
            rnfollower_list.push(followerList[i])
        }
        res.status(200).json({
            rnfollower_list
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.get_following_list = async (req, res) => {
    const followerId = req.params.followerId
    const followedId = req.params.followedId
    let rnfollowing_list = []

    try {
        let followed_owner = await Owner
            .findById(followedId, 'followingLists -_id')
            .populate("followingLists", "firstName lastName")
            .exec();

        let follower_owner = await Owner
            .findById(followerId, 'followingLists')
            .exec();

        let followerList = JSON.parse(JSON.stringify(followed_owner.followingLists))
        let ownerFollowingList = JSON.parse(JSON.stringify(follower_owner.followingLists))

        for (let i = 0; i < followerList.length; i++) {
            if (ownerFollowingList.includes(followerList[i]._id)) {
                followerList[i].status = "following"

            } else {
                followerList[i].status = "follow"
            }
            rnfollowing_list.push(followerList[i])
        }

        res.status(200).json({
            rnfollowing_list
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.update_owner_info_without_propic = async (req, res) => {
    let updatedInfo = req.body

    try {
        let owner = await Owner.findById(updatedInfo.ownerId);
        owner.firstName = updatedInfo.firstName
        owner.lastName = updatedInfo.lastName
        owner.country = updatedInfo.country
        owner.city = updatedInfo.city
        owner.phNo = updatedInfo.phNo
        owner.job = updatedInfo.job
        owner.save();
        res.status(200).json(
            {
                "message": "EDITED"
            }
        )
    } catch (error) {
        console.log(error)
        res.status(500).json(
            {
                "message": "ERROR"
            }
        )
    }

}

exports.update_owner_info_with_propic = async (req, res) => {
    let edited_propic = req.file
    let editedInfo = JSON.parse(req.body.EditedInfo)
    let rnMedia = ""
    try {
        if (edited_propic) {

            const media_modal = new Media({
                _id: new mongoose.Types.ObjectId,
                type: "PET_PROFILE"
            })

            //get metadata of propic

            const pic = await sharp(edited_propic.path).metadata();
            media_modal.width = pic.width;
            media_modal.height = pic.height;
            media_modal.contentType = edited_propic.mimetype;
            media_modal.mediaUrl = edited_propic.filename;
            rnMedia = await media_modal.save();
        }

        let owner = await Owner.findById(editedInfo.ownerId);
        owner.firstName = editedInfo.firstName
        owner.lastName = editedInfo.lastName
        owner.description = editedInfo.description
        owner.country = editedInfo.country
        owner.city = editedInfo.city
        owner.phNo = editedInfo.phNo
        owner.job = editedInfo.job
        owner.profile = rnMedia._id
        owner.save();
        res.status(200).json({
            "message": "EDITED"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.follow_owner = async (req, res) => {
    const followerId = req.params.followerId;
    const followedId = req.params.followedId;

    try {
        let followed_owner = await Owner.findById(followedId);
        //check owner valid
        if (followed_owner) {
            const followed_index = followed_owner.followerLists.indexOf(followerId);
            //add if followerId not involved in followerLists
            if (followed_index === -1) {
                followed_owner.followerLists.push(followerId)
                followed_owner.save();
            }

            let follower_owner = await Owner.findById(followerId)

            if (follower_owner) {
                const follower_index = follower_owner.followingLists.indexOf(followedId)
                if (follower_index === -1) {
                    follower_owner.followingLists.push(followedId)
                    follower_owner.save()
                }
            }

            return res.status(200).json({
                message: "OK"
            })
        }
        return res.status(404).json({
            message: "NOT_OK"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error
        })
    }
}

exports.unfollow_owner = async (req, res) => {
    try {
        const followerId = req.params.followerId
        const followedId = req.params.followedId

        let followed_owner = await Owner.findById(followedId)

        if (followed_owner) {
            const followed_index = followed_owner.followerLists.indexOf(followerId)

            if (followed_index >= 0) {
                followed_owner.followerLists.splice(followed_index, 1);
                followed_owner.save();
            }

            let follower_owner = await Owner.findById(followerId);
            if (follower_owner) {
                const follower_index = follower_owner.followingLists.indexOf(followedId);

                if (follower_index >= 0) {
                    follower_owner.followingLists.splice(follower_owner, 1);
                    follower_owner.save();
                }
            }
            return res.status(200).json({
                message: "OK"
            })
        }
        return res.status(404).json({
            message: "NOT_OK"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error
        })

    }
}


