const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Reminder = require('./api/models/reminder')
const Notification = require('./api/models/notification')
const Owner = require('./api/models/owner')
const cors = require('cors');
const ownerRouter = require('./api/routes/owners');
const commentRouter = require('./api/routes/comments')
const petRouter = require('./api/routes/pet');
const postRouter = require('./api/routes/posts')
const config = require('./api/config/config');
const notiRouter = require('./api/routes/notification')
const OneSignal = require('onesignal-node');
const schedule = require('node-schedule');
const { getNotiSubscriber } = require('./api/utils/get-noti-subscriber')
const { SERVER_URL } = require('./api/config/config')
let app = express();
let server = require('http').Server(app)
let io = require('socket.io')(server)

const all_posts_socket = io.of('/all_posts').on('connection', () => { });

const likes_socket = io.of('/all_likes').on('connection', () => { });

const follower_posts_socket = io.of('/follower_posts').on('connection', () => { });

const noties_socket = io.of('/all_noties').on('connection', () => { });
//creating a new client for a single app
const myClient = new OneSignal.Client({
    userAuthKey: config.ONE_SIGNAL_USER_AUTH_KEY,
    app: { appAuthKey: config.ONE_SIGNAL_REST_KEY, appId: config.ONE_SIGNAL_APP_ID }
});

let j = schedule.scheduleJob('00 10 10 * * *', async () => {
    console.log("Start reminder")
    let background_playerIds = []
    try {

        let reminder = await Reminder.find()
            .populate("pet")
            .exec()
        //console.log(reminder[0])
        let currentDate = new Date()
        let currentDay = currentDate.getDate();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear()

        if (reminder.length > 0) {
            for (i = 0; i < reminder.length; i++) {
                let savedDate = new Date(reminder[i].date);
                let savedDay = savedDate.getDate();
                let savedMonth = savedDate.getMonth();
                let savedYear = savedDate.getFullYear();

                const newNoti = new Notification(
                    {
                        _id: new mongoose.Types.ObjectId(),
                        type: reminder[i].type,
                        pet: reminder[i].pet._id,
                        dataId: reminder[i].pet._id,
                        media: reminder[i].pet.petProPic
                    }
                )
                //codition to push noti
                if (savedYear == currentYear && savedMonth == currentMonth) {
                    //for today reminder
                    if (savedDay == currentDay) {
                        //save the noti
                        const rnNewNoti = await newNoti.save();

                        let rnNoti = await Notification.findById(rnNewNoti._id)
                            .populate({
                                path: 'pet',
                                select: 'petName petProPic reminder',
                                populate: {
                                    path: "reminder",
                                    select: "date type"
                                },
                            })
                            .populate('media', 'contentType')
                            .exec()

                        const petOwnerId = reminder[i].pet.owner
                        const noti_subcriber = getNotiSubscriber(noties_socket)
                        for (let i = 0, len = noti_subcriber.length; i < len; i++) {

                            const { each_noti_socket, user_id } = noti_subcriber[i];
                            if (user_id == petOwnerId) {
                                rnNoti && each_noti_socket.emit('noti::created', rnNoti);
                            }
                        }

                        let petOwner = await Owner.findById(petOwnerId).exec()

                        if (petOwner) {
                            const playerIds = petOwner.playerIds;

                            for (let j of playerIds) {
                                const { playerId, status } = j;
                                if (status === 'background' || status === 'inactive') {
                                    background_playerIds.push(playerId);
                                }
                            }
                        }
                        petOwner.notiLists.push(rnNoti._id);

                        await petOwner.save();

                        if (background_playerIds.length >= 1) {
                            if (rnNoti) {
                                const description = reminder[i].pet.petName + "has hair cut schedule tomorrow.";
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
                                    large_icon: SERVER_URL + '/owners/profile_pic/' + rnNoti.pet._id,
                                    big_picture: pic_path,
                                    include_player_ids: background_playerIds,

                                });

                                try {
                                    const push_response = await myClient.sendNotification(fn);
                                } catch (error) {
                                    console.log(error);
                                }
                            }
                        } else {
                            console.log("no background")
                        }
                        //for tomorrow reminder
                    } else if (savedDay == currentDay + 1) {
                        const rnNewNoti = await newNoti.save();
                        let rnNoti = await Notification.findById(rnNewNoti._id)
                            .populate({
                                path: 'pet',
                                select: 'petName petProPic reminder',
                                populate: {
                                    path: "reminder",
                                    select: "date type"
                                },
                            })
                            .populate('media', 'contentType')
                            .exec()

                        const petOwnerId = reminder[i].pet.owner
                        const noti_subscriber = getNotiSubscriber(noties_socket);

                        for (let i = 0, len = noti_subscriber.length; i < len; i++) {

                            const { each_noti_socket, user_id } = noti_subscriber[i];

                            if (user_id == petOwnerId) {
                                rnNoti && each_noti_socket.emit('noti::created', rnNoti);
                            }
                        }

                        let petOwner = await Owner.findById(petOwnerId).exec()

                        if (petOwner) {
                            const playerIds = petOwner.playerIds;

                            for (let j of playerIds) {
                                const { playerId, status } = j;
                                if (status === 'background' || status === 'inactive') {
                                    background_playerIds.push(playerId);
                                }
                            }
                        }
                        
                        petOwner.notiLists.push(rnNoti._id);

                        await petOwner.save();
                        if (background_playerIds.length >= 1) {
                            if (rnNoti) {
                                const description = reminder[i].pet.petName + "has hair cut schedule tomorrow.";
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
                                    large_icon: SERVER_URL + '/owners/profile_pic/' + rnNoti.pet._id,
                                    big_picture: pic_path,
                                    include_player_ids: background_playerIds,

                                });

                                try {
                                    const push_response = await myClient.sendNotification(fn);
                                } catch (error) {
                                    console.log(error);
                                }
                            }

                        } else {
                            console.log("no background")
                        }

                    }
                }
            }
        }
    } catch (error) {
        console.log("error", error)
    }
});

//db config
mongoose.Promise = global.Promise;
mongoose.connect(config.MONGO_PATH, { useNewUrlParser: true, autoIndex: false, useCreateIndex: true, }, (err) => {
    if (err) {
        console.log("Can't connect to db.");
    }
    console.log('Connected to db.')
});



app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    req.onesignal_client = myClient;
    req.io = io;
    //for posts
    req.all_posts_socket = all_posts_socket;
    req.follower_posts_socket = follower_posts_socket;
    //to track likes,dislikes and comments count
    req.likes_socket = likes_socket;
    //for noti
    req.noties_socket = noties_socket;
    next();
})

app.use("/owners", ownerRouter);
app.use('/posts', postRouter);
app.use("/pets", petRouter);
app.use("/notifications", notiRouter)
app.use("/comments", commentRouter)

module.exports = { app, server };
