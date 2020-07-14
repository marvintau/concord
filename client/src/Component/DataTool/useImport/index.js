import React, {useRef, useState} from 'react';
import {Spinner} from 'reactstrap';
import Agnt from 'superagent';

import './file-input.css';

const ident = e => e;

function Button({stage, progress, select}) {
    if (stage === 'UPLOAD') {
        return <button className="button upload" disabled>
            <div className="input-button">
                <Spinner size="sm" />
                <div>已上传</div>
                <div>{progress.toFixed(2)}%</div>
            </div>
        </button>
    } else if (stage === 'PROCESS') {
        return <button className="button upload" disabled>
            <div className="input-button">
                <Spinner size="sm" /><div>后台处理中...</div>
            </div>
        </button>
    } else {
        return <div className='button upload' onClick={select}>
            <div className="input-button">上传</div>
        </div>
    }
}

export default function({hidden, sheetName, context={}, setStatus, refresh}){
    
    const [isUploading, setIsUuploading] = useState(false);
    const [stage, setStage] = useState('READY');
    const [progress, setProgress] = useState(0);
    const [inputKey, setInputKey] = useState(Math.random().toString(36));
    
    const fileRef = useRef(null);
    
    const [dataName, setDataName] = useState(context.importedData !== undefined ? undefined : sheetName);
    
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
                refresh({[sheetName]:data});
            } else {
                console.log(error, 'Upload error');
                setStatus(error);
            }
        });
    }
    
    const toggleUploading = () => {
        setIsUuploading(!isUploading)
    }

    const uploadForm = isUploading
    ? <div key='import-form' className="upload-wrapper">
        <input key={inputKey} ref={fileRef} className='file-input' type="file" id="choose-backup-file" title="" onChange={uploadFile}/>
        <select value={dataName} onChange={(e) => setDataName(e.target.value)}>
        {context.importedData === undefined
            ? [<option>无上传选项</option>]
            : [<option key='def' value={undefined}>请选择数据</option>].concat(context.importedData.map(({name, desc}, i) => <option key={i} value={name}>{desc}</option>))
        }
        </select>
        <Button {...{stage, progress, select:() => {fileRef.current.click();}}} />
      </div>
    : <div key='import-form'></div>;

    const uploadButton = hidden
    ? <div></div>
    : <button className='button' onClick={toggleUploading} key='import-button'>
          {`${isUploading ? '取消导入' : '导入数据'}`}
      </button>

    return [uploadButton, uploadForm]
}
