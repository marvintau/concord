const fs = require('fs').promises;
const path = require('path');

const CONFIRMATION_MANAGEMENT = async (data, context) => {
  
  const {pid} = context;

  const reformedData = data.map((rec, i) => {
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

  await fs.writeFile(path.resolve(`./file_store/Project/${pid}/CONFIRMATION_MANAGEMENT`), JSON.stringify(reformedData));

  return reformedData;
}

module.exports = CONFIRMATION_MANAGEMENT