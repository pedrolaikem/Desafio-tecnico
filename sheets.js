const { google } = require('googleapis');

async function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1eeDc8ZY3hkKcAvx-apkCBipWEAzcX53z5u5VLFqDLvc',
    range: 'engenharia_de_software!A4:H27',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('Nenhum dado encontrado.');
    return [];
  }
  
  // List that will contain all the data
  let dataToAdd = []; 

  //Code when the main grade system is contained
  rows.forEach((row) => {

    //variables
    let situation = '';
    let naf = '';
    let classes = 60;
    let average = (parseInt(row[3]) + parseInt(row[4]) + parseInt(row[5])) / 3;
    let maxAbsences = classes * 0.25;
    let attendances = row[2];

    //All the situations for all averages and absences

    if (average < 50 && attendances > maxAbsences) {
      situation = 'Reprovado por falta';
    } else if (average < 50 && attendances < maxAbsences) {
      situation = 'Reprovado por nota';
    } else if (average > 70 && attendances > maxAbsences) {
      situation = 'Reprovado por falta';
    } else if (average > 70) {
      situation = 'Aprovado';
    } else if (average > 50 && average < 70 && attendances > maxAbsences) {
      situation = 'Reprovado por falta';
    } else {
      situation = 'Exame Final';
    }

    //Result of NAF

    if (situation === 'Exame Final') {
      naf = 100 - average;
    } else {
      naf = 0;
    }
    
    dataToAdd.push([situation, Math.round(naf)]);
  });

  return dataToAdd;
}


 // Append data to the spreadsheet.

async function appendToSheet(auth, dataToAdd) {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1eeDc8ZY3hkKcAvx-apkCBipWEAzcX53z5u5VLFqDLvc';
  const range = 'engenharia_de_software!G4:H27';

  const resource = {
    values: dataToAdd
  };

  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      resource: resource
    });

    console.log('Dados adicionados com sucesso:', response.data);
  } catch (error) {
    console.error('Erro ao adicionar dados:', error);
  }
}

module.exports = { listMajors, appendToSheet };
