const router = require('express').Router();
const generateTTS = require('../module/generateTTS');
const Polly = require('../module/polly');

router.post('/', async (req, res) => {
    //from FE
    const phraseArray = req.body.phraseArray;

    //to FE
    const result = {
        message: null,
        data: {}
    };
    let statusCode = 200;

    //validation check
    if(!Array.isArray(phraseArray)) {
        statusCode = 400;
        result.message = 'bad request';
    }

    //main
    if(statusCode === 200) {
        try {
            result.data.ttsInfo = await generateTTS(phraseArray);
        } catch(err) {
            console.log(err);

            statusCode = 409;
            result.message = '예상하지 못한 에러가 발생했습니다.';
        }
    }

    //send result
    res.status(statusCode).send(result);
});

module.exports = router;