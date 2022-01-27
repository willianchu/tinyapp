// n is the length of the string
const generateRandomString = function(n) {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // all possible characters
  for (let i = 0; i < n; i++) {
    randomString += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return randomString; // return the random string
  
};

module.exports = generateRandomString;

