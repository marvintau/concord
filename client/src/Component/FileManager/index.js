import React, {useRef, useState} from 'react';
import Agnt from 'superagent';

import './file-input.css';

export default function({title="上传文件", uploadURL, message}){

    const [isUploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [inputKey, setInputKey] = useState(Math.random().toString(36));

    const fileRef = useRef(null);

    const uploadFile = (e) => {
        const form = new FormData();
        for (let key in message){
            form.append(key, message[key]);
        }
        
        for (let file of e.target.files){
            console.log(file.name, 'append file');
            form.append('files', file, file.name);
        }
        console.log(form.getAll('files'))

        setUploading(true);

        Agnt.post(uploadURL)
            .on('progress', ({percent}) => {
                setProgress(percent);
            })
            .send(form)
            .then((res) => {
                setUploading(false);
                setInputKey(Math.random().toString(36))
                console.log(res.body);
            });
    }

    const selectFile = (e) => {
        fileRef.current.click();
    }


    const display = isUploading ? <div className="input-button">
        <div>已上传</div>
        <div>{progress.toFixed(2)}%</div>
    </div> : title;
    const style =  {backgroundImage:`linear-gradient(0deg, #FFC0CB ${progress.toFixed(2)}, #00FFFF ${(1-progress).toFixed(2)})`};

    return <div className="upload-wrapper">
        <input key={inputKey} ref={fileRef} className='file-input' type="file" id="choose-backup-file" title="" onChange={uploadFile} multiple />
        <button className="button upload" style={style} onClick={selectFile}>{display}</button>
    </div>
}
