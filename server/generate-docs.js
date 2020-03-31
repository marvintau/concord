const fs = require('fs');
const {retrieveRecs} = require('./database');

const archiver = require('archiver-promise');
const createDocs = require('docx-templates');

async function generateDocs(project_id, project_name){

  const archive = archiver('zip', {
    zlib: { level: 5 }
  })

  const confirmationRecs = await retrieveRecs({table: 'CONFIRMATION_MANAGEMENT', project_id});
  console.log(confirmationRecs.length, project_id, 'confrims read')

  fs.mkdirSync(`generated/${project_id}`, {recursive: true});

  console.log(fs.readdirSync(__dirname), 'dirs')

  let archiveOutput = fs.createWriteStream(`generated/${project_id}/${project_name}.zip`);
  archive.pipe(archiveOutput)

  await Promise.all(confirmationRecs.map(async rec => {
    let {ID} = rec;

    console.log(ID, 'reading rec');

    const baseProps = {
      template: `${__dirname}/files/TEMPLATE.docx`,
      additionalJsContext: {
        qrCode: dataUrl => {
          const data = dataUrl.slice('data:image/gif;base64,'.length);
          return { width: 2, height: 2, data, extension: '.gif' };
        },
      }
    }

    let output = `generated/${project_id}/RESULT.${project_id}-${ID}.docx`;

    const data = {...rec, project_name};
    await createDocs({...baseProps, output, data})

    await archive.file(output, {name:`${project_id}-${ID}.docx`});
  }))

  archive.finalize();

  return project_name;
}

module.exports = generateDocs;