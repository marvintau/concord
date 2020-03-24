import React, {useState, useEffect, createRef, useRef} from 'react';
import {Button} from 'reactstrap';

import { BrowserMultiFormatReader } from '@zxing/library';

import './qr-scanner.css';

function initReader(){
  const codeReader = new BrowserMultiFormatReader();

  return codeReader.getVideoInputDevices()
  .then(videoInputDevices => {
    if (videoInputDevices.length <= 0){
      throw Error('没有找到摄像头');
    }
    return {
      videoDeviceID: videoInputDevices[0].deviceId,
      codeReader
    }
  })
  .catch(err => {
    console.log(err);
  })
}

export default function QRCodeScanner ({buttonName, success}) {

  const [reader, setReader] = useState();
  const [deviceID, setDeviceID] = useState();

  const [message, setMessage] = useState();

  const videoRef = useRef(null);

  useEffect(() => {
  (async function (){
      const {videoDeviceID, codeReader} = await initReader();
      setReader(codeReader);
      setDeviceID(videoDeviceID);
  })()
  }, [reader, deviceID]);

  const turnOffCamera = () => {
    const videoElem = videoRef.current;
    console.log(videoElem);
    const stream = videoElem.srcObject;
    const tracks = stream.getTracks();
  
    tracks.forEach(function(track) {
      track.stop();
    });
  
    videoElem.srcObject = null;

    setMessage('请重新唤醒相机')
  }

  const decodeOnce = (codeReader, selectedDeviceId) => {

    setMessage('相机在7秒钟内关闭');

    // setTimeout(turnOffCamera, 7000);

    codeReader.decodeFromInputVideoDevice(undefined, 'video')
      .then((result) => {
        success(result);
      }).catch((err) => {
        setMessage(err.toString());
      })
  }

    return <div className="qr-wrapper">
      <video ref={videoRef} id="video" width="200" height="200" style={{border: '1px solid gray', margin:'30px'}} />
      <Button style={{margin:'30px'}} size="lg" color="primary" onClick={() => decodeOnce(reader, deviceID)}>{buttonName}</Button>
      <div>{message}</div>
    </div>
}