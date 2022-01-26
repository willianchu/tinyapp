// this program is used to convert a javascript object to a disk file in Json format
const fs = require("fs");
const path = require("path");

const object2disk = function(object, fileName) {
  let jsonString = JSON.stringify(object);
  fs.writeFileSync(path.join(__dirname, fileName), jsonString); // the dirname is undefined so is the current directory
};

// retrieve the object from disk  and convert it to a javascript object
const disk2object = function(fileName) {
  let jsonString = fs.readFileSync(path.join(__dirname, fileName), "utf8");
  // the dirname is undefined so is the current directory
  return JSON.parse(jsonString);
};

module.exports = {
  object2disk, disk2object
};