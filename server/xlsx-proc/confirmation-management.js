const fs = require('fs').promises;
const path = require('path');
const QRCode = require('easyqrcodejs-nodejs');

const {readSingleSheet} = require('./utils');

const generateQR = async text => {

  const options = {
    text,
    width: 128,
    height: 128,
    colorDark : "#000000",
    colorLight : "transparent",
    correctLevel : QRCode.CorrectLevel.H, // L, M, Q, H
    dotScale: 1 // Must be greater than 0, less than or equal to 1. default is 1
  }

  try {
    let result = await (new QRCode(options)).toDataURL().then(res => res);
    return result;
  } catch (err) {
    console.log(err);
    return 'error';
  }
}

const CONFIRMATION_MANAGEMENT = async (fileBuffer, context) => {
  
  const {pid} = context;

  let data = readSingleSheet(fileBuffer);

  let newData = [];
  for (let [index, rec] of data.entries()){
    const {ID, CompanyName, CompanyAddress, CompanyContactName, CompanyContactPhone} = rec;
    let newRec = {
      ID,
      contact: {
        company: CompanyName,
        address: CompanyAddress,
        contact: CompanyContactName,
        phone: CompanyContactPhone
      },
      path: [index]
    };
    newRec.qr = await generateQR(`sheet=CONFIRMATION_MANAGEMENT&pid=${pid}&ID=${ID}`);
    console.log('qr', pid, ID);
    newData.push(newRec);
  }

  await fs.writeFile(path.resolve(`./file_store/PROJECT/${pid}/CONFIRMATION_MANAGEMENT`), JSON.stringify(newData));

  return {data:newData};
}

module.exports = CONFIRMATION_MANAGEMENT