import React, {useState, useEffect, useContext} from 'react';
import saveAs from 'file-saver';
import Agnt from 'superagent';
import { DepRouterContext } from '../../DepRouter';

function s2ab(s) { 
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf);  //create uint8array as viewer
  for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
  return buf;    
}

export default ({name, desc, companyName}) => {

  const [status, setStatus] = useState('DONE');

  const {currArgs} = useContext(DepRouterContext);

  useEffect(() => {
    if(status === 'PULL'){
      (async() => {
        try {
          const res = await Agnt.post(`/export/${name}`).send({currArgs});
          const buffer = s2ab(res.text);
          console.log(res, 'result');
          saveAs(new Blob([buffer],{type:"application/octet-stream"}), `导出-${companyName}-${desc}.xlsx`);
          setStatus('DONE');
        } catch (err) {
          console.error(err);
          setStatus('DEAD');
        }
      })();
    }
  }, [status])

  const getExport = () => {
    setStatus('PULL');
  }

  return <button className="button" onClick={() => getExport()}>导出至Excel工作表</button>
}
