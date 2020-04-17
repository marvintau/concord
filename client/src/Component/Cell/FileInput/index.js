import React, {useRef, useState} from 'react';
import Agnt from 'superagent';

import './file-input.css';

export default ({sheetName, colName, data}) => {

  const {__children, __path, ...rec} = data;
  const [stage, setStage] = useState('READY');
  const [progress, setProgress] = useState(0);

  const fileRef = useRef(null);

  const selectFile = (e) => {
    fileRef.current.click();
  }

  const upload = (e) => {
    const form = new FormData();
    form.append('file', e.target.files[0]);
    form.append('type', 'UPDATE');
    form.append('key', colName);

    for (let col in rec) if (!col.startsWith('__')){
      form.append(col, rec[col]);
    }

    setStage('UPLOAD');

    Agnt.post(`/upload/${sheetName}`)
    .on('progress', ({percent}) => {
        percent && setProgress(percent);
        if (percent && percent > 0.99){
            setStage('PROCESS');
        }
    })
    .send(form)
    .then((res) => {
      setStage('READY');
      const {ok, error} = (res.body);
      if(ok){
        console.log('ok!')
      }
      if(error){
        console.error(error);
      }
    });
  }

  const display = stage === 'READY'
  ? <div className='upload-button' onClick={selectFile} />
  : stage === 'UPLOAD'
  ? <div>{progress}</div>
  : <div>...</div>

  return <div className="upload-wrapper">
    <input ref={fileRef} style={{display:'none'}} type="file" id="choose-backup-file" title="" onChange={upload}/>
    {display}
  </div>
}