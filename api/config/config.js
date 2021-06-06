const os = require('os');

const local_mongo_path = 'mongodb://localhost:27017/PetNetwork';

const MONGO_PATH = local_mongo_path

const BASE_PATH = os.homedir() + '/PetNetwork/Upload/'

const JWT_KEY = 'secure_pet_network'

const local = 'http://192.168.43.212:3000'

const SERVER_URL = local;

const ONE_SIGNAL_USER_AUTH_KEY = "ZjhhODAyMGEtOWU5ZC00N2JhLWIyY2MtM2VkZjY5OWJhYzlj"

const ONE_SIGNAL_REST_KEY = "ZjIzNzhjMjYtZWIxYi00YmU0LThjMDAtNjRlZDU2ZjJlMjU5";

const ONE_SIGNAL_APP_ID = "0353aa65-9228-402f-934d-d9a08d5fe61b"

const OWNER_PROPIC_FOLDER = BASE_PATH + "OwnerProPics/"

const FFMPEG_PATH = os.homedir() + "/ffmpeg/ffmpeg"

const FEED_PIC_URL = BASE_PATH + 'FeedPics/'

const PET_PROPIC_FOLDER = BASE_PATH + "PetProPics/"

const PET_VACCINE_FOLDER = BASE_PATH + "PetVaccinePics/"

const PET_HAIR_CUT_PIC_FOLDER = BASE_PATH + "PetHairCutPics/"

const THUMBNAIL_URL = BASE_PATH + 'Thumbnails/'

module.exports = {
    MONGO_PATH,
    BASE_PATH,
    OWNER_PROPIC_FOLDER,
    JWT_KEY,
    PET_PROPIC_FOLDER,
    PET_VACCINE_FOLDER,
    ONE_SIGNAL_APP_ID,
    ONE_SIGNAL_REST_KEY,
    ONE_SIGNAL_USER_AUTH_KEY,
    FFMPEG_PATH,
    FEED_PIC_URL,
    THUMBNAIL_URL,
    SERVER_URL,
    PET_HAIR_CUT_PIC_FOLDER
}