import React, {useRef, useState} from 'react';
import {Spinner} from 'reactstrap';
import Agnt from 'superagent';

import './file-input.css';

const ident = e => e;

export default function({desc="文件", name, context={}, refresh=ident, setStatus=ident}){

    const [stage, setStage] = useState('READY');
    const [progress, setProgress] = useState(0);
    const [inputKey, setInputKey] = useState(Math.random().toString(36));

    const fileRef = useRef(null);

    const [dataName, setDataName] = useState(context.importedData !== undefined ? undefined : name);

    const uploadFile = (e) => {
        const form = new FormData();
        for (let key in context){
            form.append(key, context[key]);
        }
        console.log(context, 'upload');
        form.append('file', e.target.files[0])

        setStage('UPLOAD');

        Agnt.post(`/upload/${dataName}`)
            .on('progress', ({percent}) => {
                percent && setProgress(percent);
                if (percent && percent > 0.99){
                    setStage('PROCESS');
                }
            })
            .send(form)
            .then((res) => {
                setStage('READY');
                setInputKey(Math.random().toString(36))
                const {error, ...data} = (res.body);
                if(error === undefined){
                    console.log('Uploaded done!')
                    setStatus('DONE_UPLOAD');
                    refresh({[name]:data});
                } else {
                    console.log(error, 'Upload error');
                    setStatus(error);
                }
            });
    }

    const selectFile = (e) => {
        fileRef.current.click();
    }

    const display = stage === 'UPLOAD'
        ? <div className="input-button">
            <Spinner size="sm" />
            <div>已上传</div>
            <div>{progress.toFixed(2)}%</div>
          </div>
        : stage === 'PROCESS'
        ? <div className="input-button">
            <Spinner size="sm" />
            <div>后台处理中...</div>
          </div>
        : <div className="input-button">上传</div>;

    return <div className="upload-wrapper">
        <input key={inputKey} ref={fileRef} className='file-input' type="file" id="choose-backup-file" title="" onChange={uploadFile}/>
        <select value={dataName} onChange={(e) => setDataName(e.target.value)}>
            {context.importedData === undefined
            ? <option value={name}>{desc}</option>
            : [<option key='def' value={undefined}>请选择数据</option>].concat(context.importedData.map(({name, desc}, i) => <option key={i} value={name}>{desc}</option>))
            }
        </select>
        <button className="button upload" onClick={selectFile} disabled={dataName === undefined}>{display}</button>
    </div>
}
