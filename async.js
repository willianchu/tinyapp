// this program is used to convert a javascript object to a disk file in Json format
const fs = require("fs");
const path = require("path");

const object2disk = function(object, fileName) {
  let jsonString = JSON.stringify(object);
  // write object to disk asynchronously with error handling
  fs.writeFile(path.join(__dirname, fileName), jsonString, "utf8", err => {
    if (err) { // dirname is the current directory (undefined)
      console.log(err);
    }
  }); // example in https://stackoverflow.com/questions/31978347/fs-writefile-in-a-promise-asynchronous-synchronous-stuff
};

// retrieve the object from disk  and convert it to a javascript object
const disk2object = function(fileName) {
  // read file asynchronously with error handling
  fs.readFile(path.join(__dirname, fileName), "utf8", (err, data) => {
    if (err) {
      console.log(err);
    }
    return JSON.parse(data);
  });
};

module.exports = {
  object2disk, disk2object
};