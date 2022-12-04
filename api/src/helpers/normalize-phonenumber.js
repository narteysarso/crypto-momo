module.exports = function normalizePhonenumber(areaCode,phonenumber) {
  return `+${areaCode}${phonenumber
    .slice(-9)
    .split(" ")
    .map(char => char.trim())
    .join("")}`;
}