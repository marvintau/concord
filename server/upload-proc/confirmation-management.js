// const fs = require('fs').promises;
// const path = require('path');
const {remove, createRecs} = require('../database');

const {readSingleSheet, generateQR} = require('./utils');

const CONFIRMATION_MANAGEMENT = async (fileBuffer, context) => {
  
  const {project_id} = context;

  await remove({project_id, table:'CONFIRMATION_MANAGEMENT'});

  let origData = readSingleSheet(fileBuffer);

  let data = [];
  for (let [index, rec] of origData.entries()){
    const {ID, Subject, CompanyName, CompanyAddress, CompanyContactName, CompanyContactPhone} = rec;
    let newRec = {
      project_id,
      ID,
      type: Subject,
      contact: {
        company: CompanyName,
        address: CompanyAddress,
        contact: CompanyContactName,
        phone: CompanyContactPhone
      },
      path: [index]
    };
    newRec.qr = await generateQR(`sheet=CONFIRMATION_MANAGEMENT&project_id=${project_id}&ID=${ID}`);
    console.log('qr', project_id, ID);
    data.push(newRec);
  }

  await createRecs('CONFIRMATION_MANAGEMENT', data);

  return {data};
}

module.exports = CONFIRMATION_MANAGEMENT