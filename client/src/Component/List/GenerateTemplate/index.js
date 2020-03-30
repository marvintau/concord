import React, {useState} from 'react';
import Agnt from 'superagent';
// import 

const createDownloadable = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
  a.click();    
  // a.remove();  //afterwards we remove the element again     
}


export default ({project_id, companyName}) => {

  const [stage, setStage] = useState('READY');

  const send = () => {
    (async () => {
      setStage('GENERATING');
      const {body: blob} = await Agnt.post('/generate-letters')
      .responseType('blob')
      .send({project_id, project_name:companyName});

      console.log(blob, 'send from back');
      createDownloadable(blob, `${companyName}.zip`);  
      setStage('READY');
    })();
  };

  console.log(project_id, companyName, 'generate');
  return <button className='button' onClick={send} disabled={stage==='GENERATING'}>{stage==='GENERATING' ? '生成中...' : "生成"}</button>
}