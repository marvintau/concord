const fs = require('fs').promises;
const path = require('path');

const {readSingleSheet} = require('./utils');

const CONFIRMATION_MANAGEMENT = async (fileBuffer, context) => {
  
  const {pid} = context;

  let data = readSingleSheet(fileBuffer);

  data = data.map((rec, i) => {
    const {ID, CompanyName, CompanyAddress, CompanyContactName, CompanyContactPhone} = rec;
    return {
      ID,
      contact: {
        company: CompanyName,
        address: CompanyAddress,
        contact: CompanyContactName,
        phone: CompanyContactPhone
      },
      path: [i]
    }
  })

  await fs.writeFile(path.resolve(`./file_store/Project/${pid}/CONFIRMATION_MANAGEMENT`), JSON.stringify(data));

  return {data};
}

module.exports = CONFIRMATION_MANAGEMENT