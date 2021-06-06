const express = require("express");
const router = express.Router();
const multer = require('multer');
const ownerController = require('../controllers/owners')
const { OWNER_PROPIC_FOLDER } = require('../config/config')
const checkAuth = require('../middlewares/check-auth')

const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, OWNER_PROPIC_FOLDER);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }
)

const fileFilter = function (req, file, cb) {
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
        return cb(null, true)
    } else
        return cb(new Error(mimeType + " file types are not allowed"), false);
}

const upload = multer(
    {
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 524288000 //500MB in bytes
        }
    }
);

router.post("/checkEmail", ownerController.check_email)

router.post("/signup/sendLoginEmail", ownerController.send_login_email)

router.post("/signup/saveOwnerInfo", upload.single('ownerProPic'), ownerController.save_owner_info)

router.post("/login", ownerController.owner_login);

router.post("/logout", ownerController.owner_logout)

router.post("/notifyAppChange/:ownerId", checkAuth, ownerController.notify_state_change)

router.get("/profile_pic/:ownerId", ownerController.get_profile_pic)

router.get('/owner_profile/:ownerId', checkAuth, ownerController.get_ownerInfo)

router.get("/getUnsavedNotis/:ownerId", checkAuth, ownerController.get_unsaved_notis)

router.get("/aboutOwner/:ownerId", checkAuth, ownerController.get_about_Owner)

router.get("/showFollowerList/:followerId/:followedId", checkAuth, ownerController.get_follower_list);

router.get("/showFollowingList/:followerId/:followedId", checkAuth, ownerController.get_following_list);

router.post("/updateOwnerInfo/withoutProPic", checkAuth, ownerController.update_owner_info_without_propic)

router.post("/updateOwnerInfo/withProPic", checkAuth, upload.single('editedProPic'), ownerController.update_owner_info_with_propic)

router.post("/followOwner/:followerId/:followedId", checkAuth, ownerController.follow_owner);

router.post("/unfollowOwner/:followerId/:followedId", checkAuth, ownerController.unfollow_owner);

module.exports = router;