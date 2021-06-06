const express = require('express');
const router = express.Router();
const multer = require('multer');
const petController = require("../controllers/pet")
const { PET_PROPIC_FOLDER, PET_VACCINE_FOLDER,PET_HAIR_CUT_PIC_FOLDER } = require('../config/config')
const checkAuth = require('../middlewares/check-auth')


const pet_hair_cut_storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, PET_HAIR_CUT_PIC_FOLDER);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }
)
const pet_hair_cut_fileFilter = function (req, file, cb) {
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
        return cb(null, true)
    } else
        return cb(new Error(mimeType + " file types are not allowed"), false);
}

const pet_hair_cut = multer(
    {
        storage: pet_hair_cut_storage,
        fileFilter: pet_hair_cut_fileFilter,
        limits: {
            fileSize: 524288000 //500MB in bytes
        }
    }
);


const pet_propic_storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, PET_PROPIC_FOLDER);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }
)
const pet_propic_fileFilter = function (req, file, cb) {
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
        return cb(null, true)
    } else
        return cb(new Error(mimeType + " file types are not allowed"), false);
}

const pet_propic_upload = multer(
    {
        storage: pet_propic_storage,
        fileFilter: pet_propic_fileFilter,
        limits: {
            fileSize: 524288000 //500MB in bytes
        }
    }
);

const pet_vaccine_storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, PET_VACCINE_FOLDER);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }
)
const pet_vaccine_fileFilter = function (req, file, cb) {
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
        return cb(null, true)
    } else
        return cb(new Error(mimeType + " file types are not allowed"), false);
}

const pet_vaccine_upload = multer(
    {
        storage: pet_vaccine_storage,
        fileFilter: pet_vaccine_fileFilter,
        limits: {
            fileSize: 524288000 //500MB in bytes
        }
    }
);

router.get("/petList/:ownerId", checkAuth, petController.get_pet_list)

router.post("/addPets", checkAuth, pet_propic_upload.single('petProPic'), petController.add_pet)

router.get("/getPetProPic/:mediaId", petController.get_pet_propic);

router.get("/petProfileInfo", checkAuth, petController.get_pet_profile_info);

router.get("/sameTypePets/:ownerId", checkAuth, petController.get_same_type_pets);

router.post("/requestMatch", checkAuth, petController.send_request_match)

router.get("/getMatchRequestList/:petId", checkAuth, petController.get_match_request_list)

router.post("/comfirmMatchRequest/:matchStatusId", checkAuth, petController.comfirm_request)

router.post("/deleteMatchRequest/:matchStatusId", checkAuth, petController.delete_request)

router.get("/vaccinationList/:petId", checkAuth, petController.get_vaccination_list)

router.post("/addVaccination", checkAuth, pet_vaccine_upload.array("vaccineImage"), petController.add_vaccination)

router.get("/showVaccinePic/:Id", petController.show_vaccine_pic)

router.post("/addHairCut", checkAuth,pet_hair_cut.array("hairCutImage"), petController.add_hair_cut)

router.get("/getHairCut/:Id",checkAuth,petController.get_hair_cut_list)

router.post("/deletePreviousHairCut",checkAuth,petController.delete_previous_hair_cut),

router.post("/addHairCutReminder",checkAuth,petController.set_hair_cut_reminder)

router.post("/removeHairCutReminder",checkAuth,petController.remove_hair_cut_reminder)

router.get("/showHairCutPic/:Id", petController.show_hair_cut_pic)

router.post("/comfirmHairCutReminder",checkAuth,petController.comfirm_hair_cut_reminder)

module.exports = router;