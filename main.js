'use strict';
const {
  createWorker
} = Tesseract;
const {
  PDFDocument,
  degrees,
} = PDFLib;

const form = document.getElementById('form');
const spinner = document.getElementById('spinner');
//pdfjsLib.getDocument('./pdf-rot.pdf').then(init);
//
//function init(pdf) {
//  window.pdf = pdf;
//}
//
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs';
console.log('loading doc');

let pdfBuff, pdfDoc;

window.getPDFBuff = () => pdfBuff;
/*
fetch('./pdf-rot.pdf')
  .then(a => a.arrayBuffer())
  .then(async (a) => {
    pdfBuff = new Uint8Array(a);
    pdfDoc = await PDFDocument.load(pdfBuff);
    return a;
  })
  .then(a => {
    return pdfjsLib.getDocument(a).promise;
  }).then(init)
  .catch(console.error);
//pdfjsLib.getDocument('./pdf-rot.pdf').promise.then(init).catch(console.error);
*/

function createCanvas(width, height) {
  return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width >> 1;
  canvas.height = height >> 1;
  document.body.appendChild(canvas);
  return canvas;
}

const scale = 4;
async function detectPage(doc, idx) {
  const page = await doc.getPage(idx);
  const viewport = page.getViewport({
    scale
  });
  console.time(`render${idx}`);
  const canvas = createCanvas(viewport.width, viewport.height);
  console.log(`size ${canvas.width}x${canvas.height}`);
  /** @type {CanvasRenderingContext2D} */
  const context = canvas.getContext('2d');
  page.render({
    canvasContext: context,
    viewport: viewport
  });
  console.timeEnd(`render${idx}`);
  //await worker.setParameters('user_defined_dpi', '70', `job-${i}`);
  console.time('Tesseract' + idx);
  const res = await Tesseract.detect(canvas, `job-${idx}`);
  console.log(res.data);
  console.timeEnd('Tesseract' + idx);
  return res.data;

}

async function init(doc) {
  console.log('init');
  window.doc = doc;
  let canvas, context;

  /*
  const worker = await createWorker('eng', 1, {
    legacyCore: true,
    legacyLang: true
  });
  */


  for (let i = 1; i <= doc.numPages; i++) {
    //debugger;
    //break;
  }

  const result = await Promise.all(Array.from({length: doc.numPages}, (_, i) => detectPage(doc, i+1)));

  for(let i=0; i<result.length; i++) {
    const orientation = result[i];
    const page = pdfDoc.getPage(i);
    if(orientation.orientation_degrees != 0) {
      page.setRotation(degrees(orientation.orientation_degrees));
    }

  }
  const pdfData = await pdfDoc.save();
  previewPdf(pdfData);
  console.log(result);
  console.log(pdfDoc);
  window.pdfDoc = pdfDoc
}

function previewPdf(buff) {
  const blob = new Blob([buff.buffer], {type: 'application/pdf'});
  const url = URL.createObjectURL(blob);
  console.log(url);
  const obj = document.createElement('embed');
  obj.width = window.innerWidth;
  obj.height = window.innerHeight;
  obj.src = url;
  obj.type = 'application/pdf';
  document.body.appendChild(obj);
}

function loadFile(f) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = e => res(e.target.result);
    fr.onerror = rej;
    fr.readAsArrayBuffer(f);
  });
}

form.addEventListener('submit', async(e) => {
  e.preventDefault();
  console.log('submit!!');
  const fileElm = form.elements.file;
  const file = fileElm.files[0];
  pdfBuff = await loadFile(file);
  pdfDoc = await PDFDocument.load(pdfBuff);
  console.log(file);
  const pdf = await pdfjsLib.getDocument(pdfBuff).promise;
  spinner.classList.add('active');
  await init(pdf);
  spinner.classList.remove('active');
});
