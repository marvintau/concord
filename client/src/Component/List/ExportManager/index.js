import React, {useState, useEffect, useContext} from 'react';
import saveAs from 'file-saver';
import Agnt from 'superagent';
import {flat} from '@marvintau/chua';
import {Exchange} from '@marvintau/exchange';

function s2ab(s) { 
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf);  //create uint8array as viewer
  for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
  return buf;    
}

export default ({name, colSpecs}) => {

  const [status, setStatus] = useState('DONE');
  const {Sheets} = useContext(Exchange);

  useEffect(() => {
    if(status === 'PULL'){
      (async() => {
        try {
          let {data} = Sheets[name];
          console.log(data)
          data = flat(data);

          const res = await Agnt.post('/export').send({colSpecs, data});
          const buffer = s2ab(res.text);
          console.log(res);
          saveAs(new Blob([buffer],{type:"application/octet-stream"}), `导出-${name}.xlsx`);
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
