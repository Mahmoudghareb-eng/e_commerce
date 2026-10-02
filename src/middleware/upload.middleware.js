const multer = require("multer");

const memoryStorage = multer.memoryStorage();

const uploadMemory = multer({
    storage: memoryStorage,

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },

    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

module.exports = uploadMemory;