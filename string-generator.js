const map = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789";

module.exports = (length) => {
	let result = '';
  for (let i = 0; i < length; i++) {
		result += map[Math.floor(Math.random() * map.length)];
	}
	return result;
}