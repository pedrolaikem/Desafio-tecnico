
/*READ ME
-----------------------------------------------------------------------------------------------
YOU NEED NODE.JS AND NPM TO PROCEED AND EXECUTE THE SCRIPT
IF YOU ALREADY HAVE IT, YOU NEED TO EXECUTE THIS ON THE TERMINAL

"npm install googleapis@105 @google-cloud/local-auth@2.1.0 --save"

THEN EXECUTE

"NODE ."

THE SCRIPT WILL AUTOMATICALLY START.
YOU MAY HAVE TO LOG IN WITH YOUR GOOGLE ACCOUNT, MAKE SURE YOU HAVE THE SPREADSHEET OPEN.

LINK TO THE SPREADSHEET 
https://docs.google.com/spreadsheets/d/1eeDc8ZY3hkKcAvx-apkCBipWEAzcX53z5u5VLFqDLvc/edit#gid=0
-----------------------------------------------------------------------------------------------
*/



const { authorize } = require('./auth');
const { listMajors, appendToSheet } = require('./sheets');

authorize()
  .then(auth => {
    return listMajors(auth)
      .then(dataToAdd => appendToSheet(auth, dataToAdd))
      .catch(console.error);
  })
  .catch(console.error);
