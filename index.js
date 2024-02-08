const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


async function listMajors(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1eeDc8ZY3hkKcAvx-apkCBipWEAzcX53z5u5VLFqDLvc',
    range: 'engenharia_de_software!A4:H27',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return; // Retorne nada se não houver dados
  }
  
  let dataToAdd = []; // Armazenar os dados a serem adicionados

  rows.forEach((row) => {
    let situacao = '';
    let naf = '';
    let aulas = 60;
    let media = (parseInt(row[3]) + parseInt(row[4]) + parseInt(row[5])) / 3;
    let maxFaltas = aulas * 0.25;
    let presencas = row[2];

    console.log(`Aluno : ${row[1]} - Número de faltas: ${row[2]} - Média: ${media}`);

    if (media < 50 && presencas > maxFaltas) {
      situacao = 'Reprovado por falta';
    } else if (media < 50 && presencas < maxFaltas) {
      situacao = 'Reprovado por nota';
    } else if (media > 70 && presencas > maxFaltas) {
      situacao = 'Reprovado por falta';
    } else if (media > 70) {
      situacao = 'Aprovado';
    } else if (media > 50 && media < 70 && presencas > maxFaltas) {
      situacao = 'Reprovado por falta';
    } else {
      situacao = 'Exame Final';
    }

    console.log(situacao);

    if (situacao === 'Exame Final') {
      naf = 100 - media;
    } else {
      naf = 0;
    }
    console.log(Math.round(naf))
    dataToAdd.push([situacao, Math.round(naf)]); // Adicionar os dados a serem adicionados
  });

  return dataToAdd; // Retornar os dados a serem adicionados
}

async function appendToSheet(auth, dataToAdd) { // Aceita os dados a serem adicionados
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1eeDc8ZY3hkKcAvx-apkCBipWEAzcX53z5u5VLFqDLvc';
  const range = 'engenharia_de_software!G4:H27';

  const resource = {
    values: dataToAdd // Usar os dados fornecidos
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

authorize()
  .then(auth => {
    return listMajors(auth)
      .then(dataToAdd => appendToSheet(auth, dataToAdd)) // Passar os dados coletados para appendToSheet
      .catch(console.error);
  })
  .catch(console.error);