/**
 * @file converts .obj to condensed .json for portability and easy compatibility with JavaScript.
 */

const fs = require('fs');
const path = require('path');
const OBJFile = require('obj-file-parser');

function round(num) {
  return Number(num.toFixed(6))
}

async function saveFile(path, body){
  fs.writeFile(path, body, function(error){
    if(error) throw error;
    console.log('`' + path + '` successfully saved.');
  });
}

function parseObj(inputFile, outputFile) {
  const inputPathInfo = path.parse(inputFile);
  const objFile = new OBJFile(fs.readFileSync(inputFile, 'utf-8')), input = objFile.parse(), output = { v: [], vn: [], vt: [], f: [] };
  input.models.forEach(model => {
    model.vertices.forEach(v => output.v.push(round(v.x), round(v.y), round(v.z)));
    model.vertexNormals.forEach(vn => output.vn.push(round(vn.x), round(vn.y), round(vn.z)));
    model.textureCoords.forEach(vt => output.vt.push(round(vt.u), round(vt.v)));
    model.faces.forEach(f => {
      const faceIndicies = [];
      f.vertices.forEach(fv => faceIndicies.push(fv.vertexIndex, fv.textureCoordsIndex, fv.vertexNormalIndex));
      output.f.push(faceIndicies);
    });
  });
  try {
    if (!outputFile || fs.lstatSync(outputFile).isDirectory())
      outputFile = path.resolve(outputFile || '.', inputPathInfo.name + '.json');
  } catch (e) {}
  saveFile(outputFile, JSON.stringify(output));
}

parseObj(process.argv[2], process.argv[3]);
