module.exports = function isValidPhonenumber(input_str) {
  var re = /^\+?\d{1,3}\d{9}$/;

  return re.test(input_str);
}