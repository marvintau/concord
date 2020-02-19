import React, {useRef} from 'react';

import './file-input.css';

export default function({title="上传文件", upload, data}){

    const fileRef = useRef(null);

    const uploadFile = (e) => {
        upload(e.target.files[0], data);
    }

    const selectFile = (e) => {
        fileRef.current.click();
    }

    return <div style={{display:'flex', width:'100%', alignItems:'center', margin:'5px'}}>
        <input ref={fileRef} className='file-input' type="file" id="choose-backup-file" title="" onChange={uploadFile} />
        <button className="upload-button" style={{marginLeft:'10px'}} onClick={selectFile}>{title}</button>
    </div>
}
