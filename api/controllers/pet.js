const Owner = require('../models/owner')
const MatchStatus = require('../models/match-status')
const Pet = require('../models/pet')
const Post = require('../models/post')
const Media = require('../models/media')
const Reminder = require('../models/reminder')
const OneSignal = require('onesignal-node');
const PetVaccination = require('../models/pet-vaccination')
const PetHairCut = require("../models/pet-hair-cut")
const mongoose = require('mongoose')
const sharp = require('sharp')
const Notification = require('../models/notification')
const { PET_PROPIC_FOLDER, PET_VACCINE_FOLDER, SERVER_URL, PET_HAIR_CUT_PIC_FOLDER } = require('../config/config')
const fs = require('fs');
const moment = require('moment')
const _ = require('lodash');
const schedule = require("node-schedule")
const { getNotiSubscriber } = require('../utils/get-noti-subscriber');
const { generatePetId } = require('../utils/general-services')

exports.get_pet_list = async (req, res) => {
    const ownerId = req.params.ownerId

    try {
        const owner = await Owner
            .findById(ownerId)
            .populate('pets')
            .exec()
        res.status(200).json({
            pets: owner.pets
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            "ERROR": error
        })
    }

}

exports.add_pet = async (req, res) => {
    let proPicfile = req.file;
    let petInfo = JSON.parse(req.body.petInfo)
    let i = 0

    getPetId = async () => {
        let petId = generatePetId()
        let doc = await Pet.find({ pNPetId: petId }).exec()
        i++
        console.log("I", i)

        if (doc.length == 0) {
            return petId
        }
        return getPetId()
    }

    try {

        let pNPetId = await getPetId()
        console.log("PN_petId", pNPetId)

        let rnMedia
        if (proPicfile) {
            const media = new Media({
                _id: new mongoose.Types.ObjectId,
                type: "PET_PRO_PIC"
            })

            //get metadata of propic
            const pic = await sharp(proPicfile.path).metadata();
            media.width = pic.width;
            media.height = pic.height;
            media.contentType = proPicfile.mimetype;
            media.mediaUrl = proPicfile.filename;
            rnMedia = await media.save();
        }

        const pet = new Pet({
            _id: new mongoose.Types.ObjectId,
            owner: petInfo.ownerId,
            petType: petInfo.petType,
            petName: petInfo.petName,
            petReward: petInfo.petReward,
            petDaddyName: petInfo.petDaddyName,
            petMommyName: petInfo.petMommyName,
            petBirthDate: petInfo.petBirthDate,
            petGender: petInfo.petGender,
            petWeight: petInfo.petWeight,
            petDescription: petInfo.petDescription,
            petAddress: petInfo.petAddress,
            petProPic: rnMedia._id,
            pNPetId: pNPetId,
        })
        const rnPet = await pet.save();

        if (petInfo.petDaddyId != "") {
            rnPet.petDaddy = petInfo.petDaddyId
            rnPet.save();
            pet.petDaddy = petInfo.petDaddyId
            let petDaddy = await Pet.findById(petInfo.petDaddy);
            petDaddy.childList.push(rnPet._id);
            petDaddy.save();
        }

        if (petInfo.petMommyId != "") {
            rnPet.petMommy = petInfo.petMommyId
            rnPet.save();
            let petMommy = await Pet.findById(petInfo.petMommyId);
            petMommy.childList.push(rnPet._id);
            petMommy.save();
        }

        let owner = await Owner.findById(petInfo.ownerId);
        owner.pets.push(rnPet._id);
        owner.save();
        res.status(201).json({ "message": "SAVED" })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            "message": "ERROR"
        })
    }
};

exports.get_pet_propic = async (req, res) => {
    const mediaId = req.params.mediaId
    try {
        const petProPic = await Media.findById(mediaId);
        if (petProPic) {
            petProPicUrl = PET_PROPIC_FOLDER + petProPic.mediaUrl
            fs.readFile(petProPicUrl, (error, data) => {
                if (error) {
                    console.log('error', error);
                    res.status(404).json({
                        "message": "No Such File"
                    })
                }
                res.writeHead(200, { 'Content-Type': petProPic.contentType })
                res.end(data);
            })
        }
    } catch (error) {
        console.log("ERROR", error)
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.get_pet_profile_info = async (req, res) => {
    const petId = req.query.petId
    const ownerId = req.query.ownerId
    const page = req.query.page
    let rnInfo = []

    try {
        let requestedPetInfo = await Pet.findById(petId)
            .populate("owner", "firstName lastName");
        let requesterOwnerInfo = await Owner.findById(ownerId, "pets")
            .populate({
                path: "pets",
                match: { petType: requestedPetInfo.petType }
            })
        let requestedPetMatchId = requestedPetInfo.matchStatus
        let rnStatusInfo = {}
        //first return pet Info
        rnInfo.push(requestedPetInfo);

        //second pet's current status
        //when owner is requested pet's owner
        if (requestedPetInfo.owner._id == ownerId) {
            console.log("Own pet")
            rnStatusInfo.status = "NO_STATUS"
            rnStatusInfo.matchStatusId = ""
            rnInfo.push(rnStatusInfo)
            //when request pets has no  match status
        } else if (requestedPetMatchId.length < 1) {
            console.log("requested pet has no Match Id")
            rnStatusInfo.status = "NO_STATUS"
            rnStatusInfo.matchStatusId = ""
            rnInfo.push(rnStatusInfo)
        } else {
            //requester all pets' matchStatusIds
            let requesterMatchStatusId = []
            //requester has no pets
            if (requesterOwnerInfo.pets.length < 1) {
                console.log("requester has no Pets")
                rnStatusInfo.status = "NO_STATUS"
                rnStatusInfo.matchStatusId = ""
                rnInfo.push(rnStatusInfo)
            } else {
                requesterOwnerInfo.pets.forEach(pet => {
                    if (pet.matchStatus.length > 0) {
                        pet.matchStatus.forEach(id => {
                            requesterMatchStatusId.push(id)
                        });
                    }
                });

                let result = "";
                if (requesterMatchStatusId.length > 0) {
                    //result = _.intersection(requesterMatchStatusId, requestedPetMatchId);
                    requesterMatchStatusId.forEach(Id => {
                        const index = requestedPetMatchId.indexOf(Id)

                        if (index != -1) {
                            result = Id
                            return
                        }
                    });
                    if (result != "") {
                        let mStatus = await MatchStatus.findById(result).exec();
                        if (mStatus) {
                            if (mStatus.matchStatus == "REQUEST_SENT") {
                                //petId is requestedId
                         
                                if (mStatus.matchRequestFrom == petId) {
                                
                                    rnStatusInfo.status = "COMFIRM"
                                    rnStatusInfo.matchStatusId = result
                                    rnInfo.push(rnStatusInfo)
                                } else {
                                    rnStatusInfo.status = "REQUEST_SENT"
                                    rnStatusInfo.matchStatusId = result
                                    rnInfo.push(rnStatusInfo)
                                }

                            } else {
                                rnStatusInfo.status = "MATCHED"
                                rnStatusInfo.matchStatusId = result
                                rnInfo.push(rnStatusInfo)
                            }
                        } else {
                            
                            rnStatusInfo.status = "NO_STATUS"
                            rnStatusInfo.matchStatusId = ""
                            rnInfo.push(rnStatusInfo)
                        }

                    } else {
                       
                        rnStatusInfo.status = "NO_STATUS"
                        rnStatusInfo.matchStatusId = ""
                        rnInfo.push(rnStatusInfo)
                    }
                } else {
                    rnStatusInfo.status = "NO_STATUS"
                    rnStatusInfo.matchStatusId = ""
                    rnInfo.push(rnStatusInfo)
                    console.log("All pets have no match status ids")
                }
            }
        }

        //Third feeds of pet
        // const options = {
        //     sort: { createdAt: -1 },
        //     select: '-__v',
        //     populate: [
        //         { path: 'owner', select: 'firstName lastName' },
        //         { path: 'hashTags', select: 'type hashTagString' },
        //         { path: 'media', select: 'width height contentType' },
        //         { path: 'status', select: 'type data' },
        //     ],
        //     page: page
        // };
        // try {
        //     const result = await Post.paginate({ isAvailable: true, petName: requestedPetInfo.petName }, options);
        //     console.log("pet post", result)
        //     rnInfo.push(result)
        // } catch (error) {
        //     console.log("cann't get pet post", error)
        // }

        res.status(200).json({
            rnInfo
        })

    } catch (error) {

        console.log(error);
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.get_same_type_pets = async (req, res) => {
    const ownerId = req.params.ownerId
    const petType = req.query.type

    try {
        let petOwner = await Owner.findById(ownerId, "pets")
            .populate({
                path: "pets",
                match: { petType: petType }
            })

        res.status(200).json({
            "petList": petOwner.pets
        })
    } catch (error) {
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.send_request_match = async (req, res) => {
    let matchFrom = req.body.matchFrom
    let matchTo = req.body.matchTo
    const noties_socket = req.noties_socket;
    const onesignal_client = req.onesignal_client

    let background_playerIds = []
    try {
        //initiate model
        const matchStatus = new MatchStatus({
            _id: new mongoose.Types.ObjectId,
            matchRequestFrom: matchFrom,
            matchRequestTo: matchTo,
            matchStatus: "REQUEST_SENT",
            requestedDate: Date.now(),
        })
        //saving match status
        const rnMatchStatus = await matchStatus.save();

        let petFrom = await Pet.findById(matchFrom);
        petFrom.matchStatus.push(rnMatchStatus._id)
        let rnfrom = await petFrom.save();
        let petTo = await Pet.findById(matchTo);
        console.log("petto", petTo.owner)
        petTo.matchStatus.push(rnMatchStatus._id);
        petTo.save();

        const newNoti = new Notification(
            {
                _id: new mongoose.Types.ObjectId(),
                type: "MATCH-REQUEST",
                createdBy: rnfrom.owner,
                dataId: rnfrom._id,
                media: rnfrom.petProPic
            }
        )

        const noti = await newNoti.save();

        let rnNoti = await Notification.findById(noti._id)
            .populate('createdBy', 'firstName lastName')
            .populate('media', 'contentType')
            .exec();

        const noti_subscriber = getNotiSubscriber(noties_socket)

        for (let i = 0, len = noti_subscriber.length; i < len; i++) {

            const { each_noti_socket, user_id } = noti_subscriber[i];
            if (user_id === String(petTo.owner)) {
                rnNoti && each_noti_socket.emit('noti::created', rnNoti)
            }
        }

        let toOwner = await Owner.findById(petTo.owner);
        //sent noti to requested pet's owner to notify
        if (toOwner !== null) {
            const playerIds = toOwner.playerIds

            for (let j of playerIds) {
                const { playerId, status } = j;
                if (status === 'background' || status === 'inactive') {
                    background_playerIds.push(playerId);
                }
            }
            toOwner.notiLists.push(rnNoti._id);

            try {
                let rnOwner = await toOwner.save();
            } catch (error) {
                console.log("can't save owner", error)
            }
        }

        if (background_playerIds.length >= 1) {

            if (rnNoti) {
                console.log("kk", rnNoti)
                const description = rnNoti.createdBy.firstName + ' sent you a match request.';
                let pic_path = '';
                if (rnNoti.media) {
                    pic_path = SERVER_URL + '/pets/getPetProPic/' + rnNoti.media._id;
                }

                const fn = new OneSignal.Notification({
                    headings: {
                        en: 'PetNetwork'
                    },
                    contents: {
                        en: description
                    },
                    priority: 10,
                    ///profile_pic/:ownerId"
                    large_icon: SERVER_URL + '/owners/profile_pic/' + rnNoti.createdBy._id,
                    big_picture: pic_path,
                    include_player_ids: background_playerIds
                });

                try {
                    const push_response = await onesignal_client.sendNotification(fn);
                } catch (error) {
                    console.log(error);
                }
            }
        }

        res.status(200).json({
            message: "OK"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "NOT_OK"
        })
    }
}

exports.get_match_request_list = async (req, res) => {

    const petId = req.params.petId
    let rnData = []
    try {
        let pet = await Pet.findById(petId, "matchStatus _id")
            .populate({
                path: "matchStatus",
                match: { matchStatus: "REQUEST_SENT", matchRequestTo: petId },
                populate: { path: "matchRequestFrom", model: "Pet", select: "petName petProPic petAddress" }
            })
            .exec();
            console.log(pet.matchStatus)

        if (pet.matchStatus.length > 0) {

            for (let item of pet.matchStatus) {
                rnData.push(item)
            }
        }

        res.status(200).json({
            Data: rnData
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "ERROR"
        })
    }
}

exports.comfirm_request = async (req, res) => {
    const matchstatusId = req.params.matchStatusId
    try {
        let matchStatus = await MatchStatus.findById(matchstatusId).exec()
        if (matchStatus) {
            matchStatus.matchStatus = "MATCHED"
            await matchStatus.save();
        }
        res.status(200).send();

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: error
        })
    }
}

exports.delete_request = async (req, res) => {

    let matchStatusId = req.params.matchStatusId

    try {
        let matchStatus = await MatchStatus.findById(matchStatusId).exec();

        let from = await Pet.findById(matchStatus.matchRequestFrom).exec();

        let to = await Pet.findById(matchStatus.matchRequestTo).exec()

        if (from) {
            const index = from.matchStatus.indexOf(matchStatusId);
            if (index > -1) {
                from.matchStatus.splice(index, 1);
                from.save();
            }
        }

        if (to) {
            const index = to.matchStatus.indexOf(matchStatusId);
            if (index > -1) {
                to.matchStatus.splice(index, 1);
                to.save();
            }
        }
        res.status(200).send();

    } catch (error) {
        res.status(500).send();
        console.log(error)
    }
}

exports.get_vaccination_list = async (req, res) => {
    let petId = req.params.petId
    let rnData = []
    try {
        let pet = await Pet.findById(petId, "vaccination -_id")
            .populate("vaccination")
            .exec();
        for (let i = 0; i < pet.vaccination.length; i++) {
            rnData.push(pet.vaccination[i]);
        }
        res.status(200).send(rnData);
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.add_vaccination = async (req, res) => {
    // let vaccine_info = JSON.parse(req.body.vaccinationInfo)
    // console.log(new Date(vaccine_info.nextInjectionDate))
    // console.log(new Date(vaccine_info.nextInjectionDate).getMonth())
    try {
        let vaccine_pics = req.files
        let vaccine_info = JSON.parse(req.body.vaccinationInfo)
        const onesignal_client = req.onesignal_client
        const noties_socket = req.noties_socket;
        let background_playerIds = [];
        let pet = await Pet.findById(vaccine_info.petId)
            .populate("owner")
            .exec();
        console.log(vaccine_info.nextInjectionDate)
        const vaccination_modal = new PetVaccination({
            _id: new mongoose.Types.ObjectId,
            vaccineName: vaccine_info.vaccineName,
            injectionDate: vaccine_info.injectionDate,
            nextInjectionDate: vaccine_info.nextInjectionDate,
            vaccinationNote: vaccine_info.vaccinationNote,
            pet: vaccine_info.petId,
            caredType: vaccine_info.caredType
        })

        const noti_modal = new Notification({
            _id: new mongoose.Types.ObjectId,
            createdBy: pet.owner._id,
            type: "NEXT-VACCINE",
            media: pet.petProPic,
            dataId: pet._id
        })


        // const date = new Date(2019, 1, 26, 10, 48, 0);

        // const j = schedule.scheduleJob(date, function () {
        //     console.log('The world is going to end today.');
        // });

        if (vaccine_pics && vaccine_pics.length > 0) {
            for (let file of vaccine_pics) {
                const media = new Media({
                    _id: new mongoose.Types.ObjectId,
                    type: "VACCINE_PIC"
                })
                const pic = await sharp(file.path).metadata();
                media.width = pic.width;
                media.height = pic.height;
                media.contentType = file.mimetype;
                media.mediaUrl = file.filename;
                let rnMedia = await media.save();
                vaccination_modal.vaccinePic.push(rnMedia._id)
            }


            if (vaccine_info.nextInjectionDate && vaccine_info.nextInjectionDate !== "") {

                const next = new Date(vaccine_info.nextInjectionDate)
                const formatNext = new Date(next.getFullYear(), next.getMonth(), next.getDate(), 14, 47, 0)
                //schedule for next injection
                const j = schedule.scheduleJob(formatNext, async () => {
                    console.log("You have vaccination today!")

                    const noti = await noti_modal.save()

                    let rnNoti = await Notification.findById(noti._id)
                        .populate('createdBy', 'firstName lastName')
                        .populate('media', 'contentType')
                        .exec();
                    const o = await Owner.findById(pet.owner._id)
                    o.notiLists.push(rnNoti._id)
                    o.save();

                    const noti_subscriber = getNotiSubscriber(noties_socket);
                    for (let i = 0, len = noti_subscriber.length; i < len; i++) {
                        const { each_noti_socket, user_id } = noti_subscriber[i];
                        if (user_id === String(pet.owner._id)) {
                            rnNoti && each_noti_socket.emit('noti::created', rnNoti)
                        }
                    }
                    console.log("DATE", new Date(vaccine_info.nextInjectionDate).valueOf)

                    if (pet.owner.playerIds.length > 0) {

                        for (let p of pet.owner.playerIds) {
                            background_playerIds.push(p.playerId)
                        }

                        if (rnNoti) {
                            const description = `Hi ${pet.owner.firstName} Today is vaccination`
                            let pic_path = '';
                            if (rnNoti.media) {
                                pic_path = SERVER_URL + '/pets/getPetProPic/' + rnNoti.media._id;
                            }

                            const fn = new OneSignal.Notification({
                                headings: {
                                    en: 'PetNetwork'
                                },
                                contents: {
                                    en: description
                                },
                                priority: 10,
                                ///profile_pic/:ownerId"
                                large_icon: SERVER_URL + '/owners/profile_pic/' + rnNoti.createdBy._id,
                                big_picture: pic_path,
                                include_player_ids: background_playerIds,
                                send_after: moment.unix(1551207900).utc().format('MMMM Do YYYY, h:mm:ss a')
                            });

                            try {
                                const push_response = await onesignal_client.sendNotification(fn);
                                console.log("Push", push_response.data)
                            } catch (error) {
                                console.log(error);
                            }
                        }
                    }
                })
            }

            const rnVaccination = await vaccination_modal.save();
            pet.vaccination.push(rnVaccination._id)
            await pet.save();

            return res.status(200).json({
                message: "SAVED"
            })
        } else {
            res.status(400).json({
                message: "NO vaccine image includes!"
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error
        })
    }
}

exports.show_vaccine_pic = async (req, res) => {
    let pic_id = req.params.Id
    try {
        const vaccine_pic = await Media.findById(pic_id);

        if (vaccine_pic) {
            vaccinePicUrl = PET_VACCINE_FOLDER + vaccine_pic.mediaUrl
            fs.readFile(vaccinePicUrl, (error, data) => {
                if (error) {
                    console.log('error', error);
                    return res.status(404).json({
                        "message": "No Such File"
                    })
                }
                res.writeHead(200, { 'Content-Type': vaccine_pic.contentType })
                res.end(data);
            })
        }
    } catch (error) {
        console.log("ERROR", error)
        res.status(500).json({
            "message": "ERROR"
        })
    }
}

exports.add_hair_cut = async (req, res) => {
    console.log(req.files)
    
    try {

        const info = JSON.parse(req.body.hairCutData)
        const images = req.files

        const hairCut = new PetHairCut(
            {
                _id: new mongoose.Types.ObjectId,
                cutDate: info.cutDate,
                note: info.note,
                petId: info.petId,
                caredBy: info.caredType,
            }
        )

        if (images && images.length > 0) {
            for (let file of images) {
                const media = new Media({
                    _id: new mongoose.Types.ObjectId,
                    type: "PET_HAIR_CUT_PIC"
                })
                const pic = await sharp(file.path).metadata();
                media.width = pic.width;
                media.height = pic.height;
                media.contentType = file.mimetype;
                media.mediaUrl = file.filename;
                let rnMedia = await media.save();
                hairCut.hairCutPic.push(rnMedia._id)
            }
            let rnHairCut = await hairCut.save()
            const pet = await Pet.findById(info.petId).exec();
            console.log(pet)
            console.log("rn", rnHairCut)
            pet.hairCut.push(rnHairCut._id);
            pet.save()
            return res.status(201).send()
        } else {
            res.status(400).json({
                message: "NO vaccine image includes!"
            })
        }

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({
            error: error
        })
    }
}

exports.get_hair_cut_list = async (req, res) => {
    const petId = req.params.Id
    let hairCut = {}

    try {
        let pet = await Pet.findById(petId, "hairCut reminder -_id")
            .populate("hairCut")
            .populate({ path: "reminder", match: { type: "HAIR-CUT" } })
            .sort({ createdAt: -1 })
            .exec()

        hairCut.previousRecord = pet.hairCut
        hairCut.upcomming = pet.reminder[0]

        res.status(200).send(hairCut)

    } catch (error) {
        console.log(error)
        res.status(500).json({
            "error": error
        })
    }
}

exports.delete_previous_hair_cut = async (req, res) => {
    const info = req.body

    try {
        const pet = await Pet.findById(info.petId).exec()

        //console.log(pet.hairCut.indexOf(new mongoose.Types.ObjectId(info.hairCutRecordId)))
        let index = pet.hairCut.indexOf(info.hairCutRecordId)
        if (index >= 0) {
            pet.hairCut.splice(index, 1)
        }
        pet.save()

        const doc = await PetHairCut.deleteOne({ "_id": new mongoose.Types.ObjectId(info.hairCutRecordId) }).exec()
        res.status(200).send()

    } catch (error) {
        console.log("error", error)
        res.status(500).json({
            "Error": error
        })
    }
}

exports.set_hair_cut_reminder = async (req, res) => {
    let data = req.body

    try {

        let pet = await Pet.findById(data.petId, "reminder")
            .populate({ path: "reminder", match: { type: "HAIR-CUT" } })
            .exec()

        let reminder = new Reminder(
            {
                _id: new mongoose.Types.ObjectId,
                pet: data.petId,
                type: data.type,
                date: data.date
            }
        )

        let rnReminder = await reminder.save()

        pet.reminder.push(rnReminder._id)
        pet.save();

        return res.status(201).send(rnReminder);
    } catch (error) {
        console.log("error", error)
        res.status(500).json({
            "error": error
        })
    }
}

exports.remove_hair_cut_reminder = async (req, res) => {

    try {
        let pet = await Pet.findById(req.body.petId).exec();

        let index = pet.reminder.indexOf(req.body.reminderId)
        if (index >= 0) {
            pet.reminder.splice(index, 1)
        }
        pet.save();
        let reminder = await Reminder.deleteOne({ "_id": new mongoose.Types.ObjectId(req.body.reminderId) }).exec()
        return res.status(200).send();
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: err })
    }

}

exports.comfirm_hair_cut_reminder = async (req, res) => {

    try {

        const info = req.body
        const hairCut = new PetHairCut(
            {
                _id: new mongoose.Types.ObjectId,
                cutDate: info.cutDate,
                note: info.note,
                petId: info.petId,
                caredBy: info.caredType
            }
        )

        let rnHairCut = await hairCut.save()
        const pet = await Pet.findById(info.petId).exec();
        pet.hairCut.push(rnHairCut._id);
        let index = pet.reminder.indexOf(info.reminderId)

        if (index >= 0) {
            pet.reminder.splice(index, 1)
        }

        const rnpet = await pet.save()


        let reminder = await Reminder.deleteOne({ "_id": new mongoose.Types.ObjectId(info.reminderId) }).exec()


        let rnData = await Pet.findById(info.petId, "hairCut -_id")
            .populate("hairCut")
            .exec()

        return res.status(201).send(rnData.hairCut)

    } catch (error) {
        return res.status(500).json({
            error: error
        })
    }
}
exports.show_hair_cut_pic = async (req, res) => {
    let pic_id = req.params.Id
    console.log("Hair cut pIc id", pic_id)
    try {
        const hair_cut_pic = await Media.findById(pic_id);
        console.log("result", hair_cut_pic)
        if (hair_cut_pic) {
            hairCutPicUrl = PET_HAIR_CUT_PIC_FOLDER + hair_cut_pic.mediaUrl
            fs.readFile(hairCutPicUrl, (error, data) => {
                if (error) {
                    console.log('error', error);
                    return res.status(404).json({
                        "message": "No Such File"
                    })
                }
                res.writeHead(200, { 'Content-Type': hair_cut_pic.contentType })
                res.end(data);
            })
        }
    } catch (error) {
        console.log("ERROR", error)
        res.status(500).json({
            "message": "ERROR"
        })
    }
}