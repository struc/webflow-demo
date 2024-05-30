'use strict';
const {
  PDFDocument,
  StandardFonts,
} = PDFLib;
const {
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
  ZipReader,
  ZipWriter,
  Uint8ArrayReader,
} = zip;
const detList = document.getElementById('detList');
const addRowBtn = document.getElementById('addRow');
const pdfObjElm = document.getElementById('pdfObj');
const spinner = document.getElementById('spinner');
const form = document.getElementById('formData');
let helvetica;
let pdfBinData;

const DET_ITEM_TEMPLATE = `<td>
<select name="occupier" id="occupier">
  <option value="0">Private Tenant</option>
  <option value="1">Owner occupier</option>
  <option value="2">Landlord / Managing Agent</option>
</select>
</td>
<td> <input type="text" name="fullName" id="fullName"/> </td>
<td> <input type="text" name="address" id="address"/> </td>
<td> <input type="text" name="contactNumber" id="contactNumber"/> </td>
<td> <input type="text" name="emailAddress" id="emailAddress"/> </td>
<td>
  <button type="button" data-action="delete-row">❌</button>
  <button type="button" title="preview" data-action="preview">🔍</button>
</td>
`;

async function loadTemplate() {
  const req = await fetch('_PCID_before.pdf');
  return await req.arrayBuffer();
}

async function fillForm(pdfBinData, opts) {
  const doc = await PDFDocument.load(pdfBinData);
  helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const p = doc.getPage(2);
  p.moveTo(165, 455);
  p.drawText('', {
    size: 16,
    font: helvetica,
  });
  if (opts.occupier > -1) {
    const checkPos = opts.occupier === 0 ? [0, -10] : opts.occupier === 1 ? [102, -10] : [204, -10];
    p.drawSvgPath(`M${checkPos} l5,6l10,-15`, {
      borderWidth: 2,
    });
  }

  p.moveTo(255, 390);
  p.drawText(opts.fullName, {
    size: 11,
    font: helvetica,
  });

  p.moveTo(255, 366);
  p.drawText(opts.address, {
    size: 11,
    font: helvetica,
  });

  p.moveTo(275, 297);
  p.drawText(opts.contactNumber, {
    size: 11.7,
    font: helvetica,
  });

  p.moveTo(270, 257);
  p.drawText(opts.emailAddress, {
    size: 11.7,
    font: helvetica,
  });
  return doc;

}

async function main() {
  const pdfBinData = await loadTemplate();
  const doc = await fillForm(pdfBinData, {
    occupierDetails: 2,
    fullName: 'Mr Abdul Aziz',
    address: 'Flat 3, 9 Park Drive, Bradford, BD9 4DP',
    contactNumber: '07720449992',
    emailAddress: 'n/a',
  });


  const newDoc = await doc.saveAsBase64({
    dataUri: true
  });
  pdfObjElm.data = newDoc + '#page=3';
  //console.log(newDoc);
}

loadTemplate().then(a => pdfBinData = a);
//main();

addRowBtn.addEventListener('click', () => {
  const el = document.createElement('tr');
  el.classList.add('data-row');
  el.innerHTML = DET_ITEM_TEMPLATE;
  detList.appendChild(el);
});

async function previewRow(row) {
  const det = {
      occupier: +row.querySelector('#occupier').value,
      fullName: row.querySelector('#fullName').value,
      address: row.querySelector('#address').value,
      contactNumber: row.querySelector('#contactNumber').value,
      emailAddress: row.querySelector('#emailAddress').value,
  };
  const doc = await fillForm(pdfBinData, det)
  const newDoc = await doc.saveAsBase64({
    dataUri: true
  });
  pdfObjElm.data = newDoc + '#page=3';

  
}

window.addEventListener('click', ({
  target
}) => {
  if (target && target.getAttribute('data-action')) {
    switch (target.getAttribute('data-action')) {
      case 'delete-row':
        target.closest('.data-row').remove();
        break;
      case 'preview':
        previewRow(target.closest('.data-row'));
        break;
    }
  }
}, true);

addRowBtn.click();

form.addEventListener('submit', async (e) => {
  spinner.classList.add('active');
  e.preventDefault();
  const rowData = [];
  for(const row of detList.querySelectorAll('tr')) {
    rowData.push({
      occupier: +row.querySelector('#occupier').value,
      fullName: row.querySelector('#fullName').value,
      address: row.querySelector('#address').value,
      contactNumber: row.querySelector('#contactNumber').value,
      emailAddress: row.querySelector('#emailAddress').value,
    });
  }

  const zipFileWriter = new BlobWriter();
  const zipFile = new ZipWriter(zipFileWriter);
  let i=0;
  for(const row of rowData) {
    const pdfDoc = await fillForm(pdfBinData, row)
    const binData = await pdfDoc.save();
    const binDataReader = new Uint8ArrayReader(binData);
    zipFile.add(`__doc__${i++}.pdf`, binDataReader);
  }

  zipFile.close();
  const zipFileBlob = await zipFileWriter.getData();
  saveAs(zipFileBlob, 'docs.zip');

  spinner.classList.remove('active');

});
