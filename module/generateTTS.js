const Polly = require('../module/polly');
const s3 = require('../module/s3');
const Fs = require('fs');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

// 배열의 TTS정보를 모두 만들어주는 함수
module.exports = generateTTS = async (phraseArray) => {
    let startTime = 0.0;
    let sentence = '';
    const promiseArray = [];
    for(phrase of phraseArray) {
        sentence += phrase + ' '; // 전체 문장 생성
        promiseArray.push(generatePhraseTTS(phrase)); // 각 phrase TTS 생성 Promise 배열 생성
    }

    const result = await Promise.all(promiseArray); // 비동기 처리 한 번에 실행

    const sentenceInfo = await generatePhraseTTS(sentence, false);
    const phraseInfo = result.map((data) => {
        let time = startTime;
        startTime = data.videoTime + startTime; // 각 phrase TTS 시작 시간

        return { 
            phrase: data.phrase,
            startTime: time
        }
    });

    return {
        phrase: phraseInfo,
        sentence: sentenceInfo
    };
}

// 문자의 TTS를 만들어주는 함수
const generatePhraseTTS = (text, deleteOption = true) => {
    return new Promise(async (resolve, reject) => {
        const params = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: 'Kimberly'
        }
        
        // TTS 버퍼 생성
        Polly.synthesizeSpeech(params, async (err, data) => {
            if(err) {
                reject(err);
            } else if(data.AudioStream instanceof Buffer) {
                const videoName = `${new Date().getTime()}.mp3`;
                let videoTime;

                // TTS 파일 저장
                Fs.writeFileSync(`./source/${videoName}`, data.AudioStream);

                // 길이 추출
                videoTime = await readVideoTime(`./source/${videoName}`);

                // 생성한 TTS파일 삭제
                Fs.rmSync(`./source/${videoName}`);

                if(!deleteOption) {
                    const s3params = {
                        Body: data.AudioStream,
                        Bucket: 'universe-tts',
                        Key: videoName,
                        ACL: 'public-read'
                    };

                    // s3 업로드
                    s3.upload(s3params, (err, data) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                phrase: params.Text,
                                videoTime: videoTime,
                                fileNmae: `https://universe-tts.s3.ap-northeast-2.amazonaws.com/${videoName}`
                            });
                        }
                    });
                } else {
                    resolve({
                        phrase: params.Text,
                        videoTime: videoTime,
                        fileNmae: videoName
                    });
                }
            } else {
                reject(1);
            }
        });
    });
}

// 생성된 mp3파일의 길이를 읽는 함수
const readVideoTime = async (videoPath) => {
    try {
        const result = await ffprobe(videoPath, { path: ffprobeStatic.path });

        return parseFloat(result.streams[0].duration);
    } catch(err) {
        console.log(err);
    }
}
