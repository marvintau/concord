import React, {useRef, useState} from 'react';
import Agnt from 'superagent';

import './file-input.css';

const ident = e => e;

export default function({title="上传文件", name, context={}, refresh=ident, setStatus=ident}){

    const [isUploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [inputKey, setInputKey] = useState(Math.random().toString(36));

    const fileRef = useRef(null);

    const uploadFile = (e) => {
        const form = new FormData();
        for (let key in context){
            form.append(key, context[key]);
        }
        console.log(context, 'upload');
        form.append('file', e.target.files[0])

        setUploading(true);

        Agnt.post(`/upload/${name}`)
            .on('progress', ({percent}) => {
                percent && setProgress(percent);
            })
            .send(form)
            .then((res) => {
                setUploading(false);
                setInputKey(Math.random().toString(36))
                const {ok, error, data} = (res.body);
                if(ok){
                    console.log('ok!')
                    refresh({[name]:data});
                } else {
                    setStatus(error);
                }
            });
    }

    const selectFile = (e) => {
        fileRef.current.click();
    }

    const display = isUploading
        ? <div className="input-button"><div>已上传</div><div>{progress.toFixed(2)}%</div></div>
        : <div className="input-button">{title}</div>;
    const style =  {backgroundImage:`linear-gradient(0deg, #FFC0CB ${progress.toFixed(2)}, #00FFFF ${(1-progress).toFixed(2)})`};

    return <div className="upload-wrapper">
        <input key={inputKey} ref={fileRef} className='file-input' type="file" id="choose-backup-file" title="" onChange={uploadFile}/>
        <button className="button upload" onClick={selectFile}>{display}</button>
    </div>
}
