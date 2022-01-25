// function generates a random string of length n with characters from a to z lowercase and uppercase comparing to the object to assess if the string is unique

// const uniqueStrings = {
//   eRwtew: "http://www.lighthouselabs.ca",
//   YBgdhd: "http://www.google.com",
//   rkjkfe: "http://www.microsoft.com",
// }


// n is the length of the string and object is the object to assess if the string is unique
const generateRandomString = function(n, object) {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // all possible characters
  for (let i = 0; i < n; i++) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  if (object[randomString]) { // if the random string is already in the object, generate another random string
    return generateRandomString(n, object); // recursive call
  } else {
    return randomString; // return the random string
  }
};

module.exports = generateRandomString;

// for(let i = 0; i < 10; i++) {
// console.log(generateRandomString(6, uniqueStrings));
// }